import React from 'react'
import Navbar from '../components/Navbar'
import Headers from '../components/Headers'

const Home = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-[url("/bg_img.png")] bg-cover bg-center'>
      <Navbar />
      <Headers/>
    </div>
  )
}

export default Home
