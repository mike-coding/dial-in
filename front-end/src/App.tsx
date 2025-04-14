import './App.css'
import Drawer from './components/Drawer'

function App() {
  return (
    <div className="relative h-screen w-screen flex flex-row justify-center items-center bg-gray-100">
      <Drawer/>
      <div className="BODY__ w-full flex flex-col items-center border-2 border-black mx-10 my-10"> 
        test
      </div>
    </div>
  )
}

export default App
