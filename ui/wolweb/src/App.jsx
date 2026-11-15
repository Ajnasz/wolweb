import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, ButtonTxt } from './Button.jsx';

const STATUS = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  IDLE: 'idle',
};

function StatusIcon({ status }) {
  switch (status) {
    case STATUS.LOADING:
      return <LoadingIcon className="text-xl w-8 h-8" />;
    case STATUS.SUCCESS:
      return <SuccessIcon className="text-xl w-8 h-8" />;
    case STATUS.ERROR:
      return <ErrorIcon className="text-xl w-8 h-8" />;
    default:
      return null;
  }
}

const AnimatedStatusIcon = ({ status }) => {
  const [show, setShow] = useState(true);
  const [currentStatus, setCurrentStatus] = useState(status);

  useEffect(() => {
    if (status !== currentStatus) {
      setShow(false);
      const timer = setTimeout(() => {
        setCurrentStatus(status);
        setShow(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [status, currentStatus]);

  return (
    <div
      className={classNames("absolute -top-3 -right-3 transition-all duration-200 transform", {
        'opacity-0 scale-50': !show,
        'opacity-100 scale-100': show,
      })}
    ><StatusIcon status={currentStatus} /></div>
  );
};


function getApiUrl(path) {
  if (window.location.hostname.includes('localhost')) {
    return new URL(path, 'http://localhost:8951');
  }

  return new URL(path, window.location.origin + window.location.pathname);
}

function useSendPing(mac) {
  const [ok, setOk] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);

  const sendPing = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLoading(true);
    startTimeRef.current = Date.now();

    try {
      const response = await fetch(getApiUrl(`./api/ping/${mac}`));
      if (response.ok) {
        const { status } = await response.json();
        if (status === 'ok') {
          setOk(true);
          setError(null);
        } else {
          setOk(false);
          setError(new Error('Ping timeout'));
        }
      } else {
        const { error } = await response.json();
        throw new Error(error);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      if (Date.now() - startTimeRef.current < 5000) {
        timeoutRef.current = setTimeout(() => sendPing(), 3000);
      }
    }
  }, [mac]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { ok, error, sendPing, loading };
}

function useFetchMacAddresses() {
  const [macs, setMacs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        const response = await fetch(getApiUrl('./api/macs'), { signal });
        if (response.ok) {
          const { macs } = await response.json();
          setMacs(macs || []);
        } else {
          throw new Error(response.statusText);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setError(error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, []);

  return { macs, loading, error };
}

function StatusIconWrapper({ children, className }) {
  return (
    <div className={classNames("inline-flex justify-center items-center rounded-full text-white", className)}>{children}</div>
  );
}

function SuccessIcon({ className }) {
  return <StatusIconWrapper className={classNames("bg-success", className)}>✓</StatusIconWrapper>;
}

function LoadingIcon({ className }) {
  return <StatusIconWrapper className={classNames("bg-info", className)}>⌛</StatusIconWrapper>;
}

function ErrorIcon({ className }) {
  return <StatusIconWrapper className={classNames("bg-danger", className)}>!</StatusIconWrapper>;
}

function Card({ mac, onMacSelect, status, wolError }) {
  const { Address, Name, Host } = mac;
  const { ok: pingOk, error: pingError, sendPing, loading: pingLoading } = useSendPing(Address);

  return <div
    className="relative text-center p-5 rounded-lg shadow-md shadow-card-ring/50 hover:shadow-lg bg-surface transition transition-colors transition-shadow">
    {(status === STATUS.LOADING || status === STATUS.SUCCESS || status === STATUS.ERROR) && <AnimatedStatusIcon status={status} />}
    <h2 className="text-lg">
      <ButtonTxt
        onClick={() => onMacSelect(Address)}>
        {Name}
      </ButtonTxt>
    </h2>
    <div className="text-muted text-sm cursor-pointer" onClick={() => onMacSelect(Address)}>
      <span className="font-mono">{Address.toUpperCase()}</span><br />{Host}</div>
    <footer className="mt-2">
      <div className="flex justify-between mb-2 gap-2">
        <Button onClick={() => onMacSelect(Address)}>WoL</Button>
        {Host && <Button onClick={() => sendPing(Name)}>
          Ping
          {pingOk === true && <SuccessIcon className="absolute w-4 h-4 text-sm -right-2 -top-2" />}
          {pingOk === false && <ErrorIcon className="absolute w-4 h-4 text-sm -right-2 -top-2" />}
          {pingLoading && <LoadingIcon className="absolute w-4 h-4 text-sm -right-2 -top-2" />}
          {pingError && <ErrorIcon className="absolute w-4 h-4 text-sm -right-2 -top-2" />}
        </Button>}
      </div>
      <div className="text-sm">
        {status === STATUS.SUCCESS && <div className="text-success">Sent WOL to <span className="font-mono">{Address.toUpperCase()}</span></div>}
        {status === STATUS.ERROR && <div className="text-error">Error: {wolError.message}</div>}
        {pingError && <div className="text-error">Ping Error: {pingError.message}</div>}
      </div>
    </footer>
  </div>;
}

function useSendWol() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [macAddr, setMac] = useState(null);

  async function sendWol(macAddr) {
    const body = {
      mac_addr: macAddr,
    };

    setLoading(true);
    setError(null);
    setMac(macAddr);

    let json;
    try {
      const response = await fetch(getApiUrl('./api/wol'), {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      json = await response.json();
      if (response.ok) {
        await new Promise((r) => requestAnimationFrame(r));
        return macAddr;
      }

      if (json?.error) {
        throw new Error(json.error);
      }

      throw new Error('Failed to send WOL');
    } catch (error) {
      setError(error);
    } finally {
      setLoading(null);
    }
  }

  return { sendWol, loading, error, macAddr };
}

function determineStatus(isError, isLoading, isSuccess) {
  return isError ? STATUS.ERROR :
    isLoading ? STATUS.LOADING :
      isSuccess ? STATUS.SUCCESS :
        STATUS.IDLE;
}

function App() {
  const { macs, loading, error: macError } = useFetchMacAddresses();
  const { sendWol, loading: wolLoading, error: wolError, macAddr } = useSendWol();
  const [isSuccess, setIsSuccess] = useState(false);

  function handleMacSelect(address) {
    setIsSuccess(null);
    sendWol(address).then(() => {
      setIsSuccess(address);
    });
  }

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (macError) {
    return <div className="p-4 bg-alert-bg text-danger rounded-sm">Error: {macError.message}</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
      {macs.map((mac) => <Card
        key={mac.Address}
        mac={mac}
        status={macAddr === mac.Address && determineStatus(wolError, wolLoading, isSuccess)}
        wolError={macAddr === mac.Address && wolError}
        onMacSelect={handleMacSelect}
      />)}
    </div>
  );
}

export default App
