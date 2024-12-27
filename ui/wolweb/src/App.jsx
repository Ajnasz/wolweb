import './App.css'

function App() {
  function sendWol(e) {
    e.preventDefault()
    const form = document.getElementById('WolForm');
    const formData = new FormData(form);

    fetch('/api/wol', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data)
      })
      .catch((error) => {
        console.error('Error:', error)
      });
  }

  return (
    <form class="mb-6" id="WolForm" action="/api/wol" method="post" enctype="multipart/form-data" onSubmit={sendWol}>
        <input class="
        block w-full
        px-4 py-2
        text-lg
        border border-gray-300 rounded-lg
        dark:border-gray-600
        text-gray-700
        bg-gray-50 dark:text-gray-400
        dark:bg-gray-700 dark:text-gray-200
        dark:hover:bg-gray-800
        dark:focus:bg-gray-800
        dark:border-gray-600
        dark:placeholder-gray-400
        focus:outline-none
        rounded-lg
        " type="text" name="mac_addr" id="MacAddr" multiple />
      <footer class="mt-4">
        <button type="submit" class=" text-white
            bg-blue-700 hover:bg-blue-800
            focus:ring-4
            focus:outline-none
            focus:ring-blue-300
            font-medium
            rounded-lg w-full sm:w-auto px-6 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Send</button>
      </footer>
    </form>
  )
}

export default App
