import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';

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
  return <StatusIconWrapper className={classNames("bg-green-600", className)}>✓</StatusIconWrapper>;
}

function LoadingIcon({ className }) {
  return <StatusIconWrapper className={classNames("bg-blue-600", className)}>⌛</StatusIconWrapper>;
}

function ErrorIcon({ className }) {
  return <StatusIconWrapper className={classNames("bg-red-600", className)}>!</StatusIconWrapper>;
}

function MacAddressButton({ mac, onMacSelect, status, wolError }) {
  const { Address, Name, Host } = mac;
  const { ok: pingOk, error: pingError, sendPing, loading: pingLoading } = useSendPing(Address);

  return <div className={classNames(
    `
    relative
    text-center

    p-5
    rounded-lg
    border dark:border-none
    shadow-sm hover:shadow dark:shadow-none dark:hover:shadow-none
    bg-white dark:bg-slate-900/70
    transition transition-colors transition-shadow
    focus:outline-none
    focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-300
    `)}>
    {(status === STATUS.LOADING || status === STATUS.SUCCESS || status === STATUS.ERROR) && <AnimatedStatusIcon status={status} />}
    <h2 className="text-lg">
      <button type="button"
        onClick={() => onMacSelect(Address)}
        className="
        transition transition-colors duration-150
        text-blue-600 dark:text-blue-300
        hover:text-pink-700">
        {Name}
      </button>
    </h2>
    <div className="text-gray-500 dark:text-gray-400 text-sm cursor-pointer" onClick={() => onMacSelect(Address)}
    >{Address}<br />{Host}</div>
    <footer className="mt-2">
      <div className="flex justify-between mb-2">
        <button type="button" className="
          px-4 py-2
          border rounded text-sm
          transition transition-colors duration-150
          border-blue-600 text-blue-600
          dark:text-blue-300 dark:border-blue-300
          hover:border-pink-700 hover:text-pink-700"
          onClick={() => onMacSelect(Address)}>WoL</button>
        {Host && <button type="button" className="
          px-4 py-2
          relative
          border rounded text-sm
          transition transition-colors duration-150
          bg-white dark:bg-slate-900/70
          border-blue-600 text-blue-600
          dark:text-blue-300 dark:border-blue-300
          hover:border-pink-700 hover:text-pink-700"
          onClick={() => sendPing(Name)}>
          Ping
          {pingOk === true && <SuccessIcon className="absolute w-4 h-4 text-sm -right-2 -top-2" />}
          {pingOk === false && <ErrorIcon className="absolute w-4 h-4 text-sm -right-2 -top-2" />}
          {pingLoading && <LoadingIcon className="absolute w-4 h-4 text-sm -right-2 -top-2 animate-ping" />}
          {pingError && <ErrorIcon className="absolute w-4 h-4 text-sm -right-2 -top-2" />}
        </button>}
      </div>
      <div className="text-sm">
        {status === STATUS.SUCCESS && <div className="text-green-600 dark:text-green-400">Sent WOL to {Address}</div>}
        {status === STATUS.ERROR && <div className="text-red-600 dark:text-red-400">Error: {wolError.message}</div>}
        {pingError && <div className="text-red-600 dark:text-red-400">Ping Error: {pingError.message}</div>}
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
    return <div className="p-4 bg-gray-300 text-red-600 rounded">Error: {macError.message}</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
      {macs.map((mac) => <MacAddressButton
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
