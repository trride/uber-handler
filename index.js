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

    this.getEstimate = this.getEstimate.bind(this);
    this.getDriverEstimatedTimeOfArrival = this.getDriverEstimatedTimeOfArrival.bind(
      this
    );
    this.requestRide = this.requestRide.bind(this);
    this.cancelRide = this.cancelRide.bind(this)
  }

  getEstimate(start = {}, end = {}) {
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
        price: data.fare.value,
        requestKey: {
          key: data.fare.fare_id,
          expiresAt: data.fare.expires_at * 1000
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
      fare_id: fare_id,
      product_id: this.uberMotorProductId,
      start_latitude: start.lat,
      start_longitude: start.long,
      end_latitude: end.lat,
      end_longitude: end.long
    };

    return this.axios
      .post('/requests', payload)
      .then(response => {
        return {
          requestId: "null"
        }
      });
  }

  cancelRide(requestId) {
    return this.axios
      .delete(`/requests/current`)
      .then(response => {
        return {
          cancelled: true
        }
      })
  }
};
