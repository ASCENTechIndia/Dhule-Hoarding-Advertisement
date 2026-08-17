import axios from "axios"

const GetIPAddress = async () => {
  const useDummyIp = true; 

  if (useDummyIp) {
    return "192.168.1.10";
  }

  try {
    const response = await axios.get("https://api.ipify.org?format=json");
    return response.data.ip;
  } catch (error) {
    console.error("Error fetching IP address:", error);
    return null;
  }
};

export default GetIPAddress;
