import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext.jsx'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { isAuthenticated, token } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    // If not authenticated or no token, ensure socket is disconnected
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setIsConnected(false)
      setIsReconnecting(false)
      return
    }

    // Connect to current origin, which proxies /socket.io to server port 5000 in dev
    // and serves from origin in production
    const socket = io({
      auth: {
        token
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling']
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      setIsReconnecting(false)
    })

    socket.on('disconnect', (reason) => {
      setIsConnected(false)
      if (reason === 'io server disconnect') {
        // Server forced disconnect (e.g. auth failed), don't auto-reconnect
        socket.disconnect()
      } else {
        setIsReconnecting(true)
      }
    })

    socket.on('connect_error', () => {
      setIsConnected(false)
      setIsReconnecting(true)
    })

    socket.on('reconnect', () => {
      setIsConnected(true)
      setIsReconnecting(false)
    })

    socket.on('reconnect_attempt', () => {
      setIsReconnecting(true)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
      setIsReconnecting(false)
    }
  }, [isAuthenticated, token])

  // Helper method to register an event listener and auto-cleanup on unmount
  const on = useCallback((event, callback) => {
    const socket = socketRef.current
    if (!socket) return () => {}

    socket.on(event, callback)
    return () => {
      socket.off(event, callback)
    }
  }, [])

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        isReconnecting,
        on
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export default SocketContext

