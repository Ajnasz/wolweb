import { useState, useEffect } from 'react';
import classNames from 'classnames';

function getURL(path) {
  if (window.location.hostname.includes('localhost')) {
    return new URL(path, 'http://localhost:8951');
  }

  return new URL(path, window.location.origin + window.location.pathname);
}

function useMacs() {
  const [macs, setMacs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        const response = await fetch(getURL('./api/macs'), { signal });
        if (response.ok) {
          const { macs } = await response.json();
          setMacs(macs || []);
        } else {
          throw new Error();
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

function SuccessIcon() {
  const [animate, setAnimate] = useState(false);
  requestAnimationFrame(() => {
    setAnimate(true);
  })
  return (
    <div className={classNames({
      'scale-100': animate,
      'scale-50': !animate,
    },
      `
      absolute -top-3 -right-3 flex justify-center items-center w-8 h-8 rounded-full bg-green-600 text-white text-2xl
      transition transition-transform ease-in-out duration-300
      `)}>
      ✓
    </div>
  );
}

function LoadingIcon() {
  return (
    <div className={classNames(`absolute -top-3 -right-3 grid grid-cols-1 place-items-center w-8 h-8 rounded-full bg-blue-600 text-white text-2xl duration-300 animate-bounce`
    )}><div>·</div></div>
  );
}

function MacButton({ mac, onMacSelect, isLoading, isSuccess }) {
  const { Address, Name } = mac;
  return <button type="button" className={classNames(
    `
    relative
    text-center cursor-pointer
    p-4
    rounded-lg
    border
    bg-gray-50 dark:bg-gray-700
    border-gray-300 dark:border-gray-600
    text-gray-700 dark:text-gray-200
    hover:bg-gray-200 dark:hover:bg-gray-800
    focus:bg-gray-300 dark:focus:bg-gray-600
    focus:outline-none
    focus:border-gray-300 dark:focus:border-gray-600
    focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600
    `)} onClick={() => onMacSelect(Address)}>
    {isLoading && <LoadingIcon />}
    {isSuccess && <SuccessIcon />}
    <h2 className="text-lg">{Name}</h2>
    <span className="text-gray-500 dark:text-gray-400 text-sm">{Address}</span>
  </button>;
}

function useSendWol() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  async function sendWol(macAddr) {
    const body = {
      mac_addr: macAddr,
    };

    setLoading(macAddr);
    setError(null);

    let json;
    try {
      const response = await fetch(getURL('./api/wol'), {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      json = await response.json();
      if (response.ok) {
        await new Promise((r) => setTimeout(r, 500));
        return macAddr;
      }

      if (json?.error) {
        throw new Error(json.error);
      }

      throw new Error('Failed to send WOL');
    } catch (error) {
      setError(error);
    } finally {
      setLoading(null)
    }
  }

  return { sendWol, loading, error };
}

function App() {
  const { macs, loading, error: macError } = useMacs();
  const { sendWol, loading: wolLoading, error: wolError } = useSendWol();
  const [isSuccess, setIsSuccess] = useState(false);

  function onMacSelect(address) {
    sendWol(address).then(() => {
      setIsSuccess(address);
      setTimeout(() => {
        setIsSuccess(false)
      }, 2000);
    });
  }

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (macError) {
    return <div className="p-4 bg-gray-300 text-red-800 rounded">Error: {macError.message}</div>;
  }

  if (wolError) {
    return <div className="p-4 bg-gray-300 text-red-800 rounded">
      Error: {wolError.message}
    </div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
      {macs.map((mac) => <MacButton key={mac.Address} mac={mac} onMacSelect={onMacSelect} isLoading={wolLoading === mac.Address} isSuccess={isSuccess === mac.Address} />)}
    </div>
  )
}

export default App
