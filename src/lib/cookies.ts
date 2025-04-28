// Cookie utility functions for storing and retrieving JSON data

/**
 * Set a JSON object in cookies with an expiration time
 */
export function setJsonCookie(name: string, value: any, days = 7) {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  
    try {
      const stringValue = JSON.stringify(value)
      document.cookie = `${name}=${encodeURIComponent(stringValue)};expires=${expires.toUTCString()};path=/;SameSite=Lax`
      return true
    } catch (error) {
      console.error("Error setting cookie:", error)
      return false
    }
  }
  
  /**
   * Get a JSON object from cookies
   */
  export function getJsonCookie(name: string) {
    const nameEQ = `${name}=`
    const cookies = document.cookie.split(";")
  
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.indexOf(nameEQ) === 0) {
        try {
          const value = decodeURIComponent(cookie.substring(nameEQ.length))
          return JSON.parse(value)
        } catch (error) {
          console.error("Error parsing cookie:", error)
          return null
        }
      }
    }
    return null
  }
  
  /**
   * Delete a cookie by name
   */
  export function deleteCookie(name: string) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`
  }
  