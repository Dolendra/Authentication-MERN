import { createContext, useState } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { data } from 'react-router-dom'
import { useEffect } from 'react'

export const AppContent = createContext()


export const AppContextProvider = (props)=>{
    // we are passing the cookie down here
    axios.defaults.withCredentials=true;    // when we are refreshing the page our login will be there 

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [isLoggedIn , setIsLoggedin] = useState(false)
    const [userData,setUserData] = useState(false)

    const getAuthState = async()=>{
        try {
            const {data} = await axios.get(backendUrl+'/api/auth/is-auth')
            if(data.success){
                setIsLoggedin(true);
                getUserData()
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getUserData = async()=>{
        try{
            const {data} = await axios.get(backendUrl+'/api/user/data')
            data.success ? setUserData(data.userData) : toast.error(data.message);
        }catch(error){
            if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
    } else {
        toast.error("Something went wrong!");
    }
        }
    }

    useEffect(()=>{
        getAuthState();
    },[])

    const value = {
        backendUrl,
        isLoggedIn , setIsLoggedin,
        userData,setUserData,
        getUserData
    }
    return(
        <AppContent.Provider value={value}>
            {props.children}
        </AppContent.Provider>
    )
}

