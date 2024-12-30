import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

const STATUS = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  IDLE: 'idle',
};

function StatusIcon({ status }) {
  switch (status) {
    case STATUS.LOADING:
      return <LoadingIcon />;
    case STATUS.SUCCESS:
      return <SuccessIcon />;
    case STATUS.ERROR:
      return <ErrorIcon />;
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
    <div className={classNames("flex justify-center items-center w-8 h-8 rounded-full text-white text-xl", className)}>{children}</div>
  );
}

function SuccessIcon() {
  return <StatusIconWrapper className="bg-green-600">✓</StatusIconWrapper>;
}

function LoadingIcon() {
  return <StatusIconWrapper className="bg-blue-600">⌛</StatusIconWrapper>;
}

function ErrorIcon() {
  return <StatusIconWrapper className="bg-red-600">!</StatusIconWrapper>;
}

function MacAddressButton({ mac, onMacSelect, status, wolError }) {
  const { Address, Name } = mac;
  return <button type="button" className={classNames(
    `
    relative
    text-center cursor-pointer
    p-4 rounded-lg border
    bg-gray-50 dark:bg-gray-700
    border-gray-300 dark:border-gray-600
    text-gray-700 dark:text-gray-200
    hover:bg-gray-200 dark:hover:bg-gray-800
    focus:outline-none
    focus:bg-gray-200 dark:focus:bg-gray-600
    focus:border-gray-200 dark:focus:border-gray-600
    focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-600
    `)} onClick={() => onMacSelect(Address)}>
    {(status === STATUS.LOADING || status === STATUS.SUCCESS || status === STATUS.ERROR) && <AnimatedStatusIcon status={status} />}
    <h2 className="text-lg">{Name}</h2>
    <div className="text-gray-500 dark:text-gray-400 text-sm">{Address}</div>
    <footer className="mt-2 text-sm">
      {status === STATUS.SUCCESS && <div className="text-green-600 dark:text-green-400">Sent WOL to {Address}</div>}
      {status === STATUS.ERROR && <div className="text-red-600 dark:text-red-400">Error: {wolError.message}</div>}
    </footer>
  </button>;
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
    setIsSuccess(false);
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
