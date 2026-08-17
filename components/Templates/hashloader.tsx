import React from 'react'
import { HashLoader } from 'react-spinners'

const HashloaderComponent = ({ isLoading }) => {
    return (
        <>
            {isLoading && <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 w-full h-full ">
                <div className="w-full h-full flex items-center justify-center backdrop-blur-sm">
                    <HashLoader />
                </div>
            </div>}
        </>
    )
}

export default HashloaderComponent

