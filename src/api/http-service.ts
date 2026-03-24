import apiClient from "./client";

class HttpService {
  endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async getData(name: string) {
    const response = await apiClient.get(`${this.endpoint}/${name}`);
    console.log("response from getData(name): " + response);
    return response.data;
  }
}

export default HttpService;
