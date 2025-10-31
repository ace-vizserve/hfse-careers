import React from 'react'
import Footer from '../components/footer'
import BottomSidebar from '../components/bottomSidebar'
import Navbar from '../components/navbar'

const page = () => {
  return (
    <div>
       <div className="mb-20 sm:mb-24 md:mb-32 lg:mb-35">
        <Navbar />
      </div>



        <BottomSidebar/>
     <Footer/>
    </div>
  )
}

export default page
