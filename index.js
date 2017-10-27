const Axios = require("axios");
const queryString = require("query-string");

module.exports = class UberHandler {
  constructor(config) {
    this.token = config.token || "";
    this.access_token = config.access_token || "";
    this.sandbox = config.sandbox || false;
    this.baseURL = this.sandbox
      ? "https://sandbox-api.uber.com"
      : "https://api.uber.com";

    this.uberMotorProductId = "89da0988-cb4f-4c85-b84f-aac2f5115068";

    this.axios = Axios.create({
      baseURL: this.baseURL + "/v1.2",
      headers: {
        Authorization: `Bearer ${this.access_token}`,
        "Content-Type": "application/json",
        "Accept-Language": "en_US"
      }
    });

    this.getRequestEstimate = this.getRequestEstimate.bind(this);
    this.getDriverEstimatedTimeOfArrival = this.getDriverEstimatedTimeOfArrival.bind(
      this
    );
    this.requestRide = this.requestRide.bind(this);
  }

  getRequestEstimate(start = {}, end = {}) {
    const payload = {
      product_id: this.uberMotorProductId,
      start_latitude: start.lat,
      start_longitude: start.long,
      end_latitude: end.lat,
      end_longitude: end.long
    };

    return this.axios.post(`/requests/estimate`, payload).then(response => {
      const { data } = response;

      const price = {
        high: data.estimate ? data.estimate.high_estimate : data.fare.value,
        low: data.estimate ? data.estimate.low_estimate : data.fare.value
      };

      return {
        price: {
          ...price,
          fixed: price.high == price.low,
          fare_id: data.fare.fare_id,
          expires_at: data.fare.expires_at
        }
      };
    });
  }

  getDriverEstimatedTimeOfArrival(start = {}) {
    const payload = {
      start_latitude: start.lat,
      start_longitude: start.long,
      product_id: this.uberMotorProductId
    };

    return this.axios
      .get(`/estimates/time?${queryString.stringify(payload)}`)
      .then(response => {
        return {
          estimate: response.data.times[0].estimate
        };
      });
  }

  requestRide(fare_id, start = {}, end = {}) {
    const payload = {
      fare_id,
      product_id: this.uberMotorProductId,
      start_latitude: start.lat,
      start_longitude: start.long,
      end_latitude: end.lat,
      end_longitude: end.long
    };

    return this.axios
      .post("/requests", payload)
      .then(response => response.data);
  }
};
