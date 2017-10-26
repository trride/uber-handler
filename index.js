const Axios = require("axios");
const queryString = require("query-string");

module.exports = class UberHandler {
  constructor(config) {
    this.token = config.token || "";
    this.sandbox = config.sandbox || false;
    this.baseURL = this.sandbox
      ? "https://sandbox-api.uber.com"
      : "https://api.uber.com";

    this.uberMotorProductId = "89da0988-cb4f-4c85-b84f-aac2f5115068";

    this.axios = Axios.create({
      baseURL: this.baseURL + "/v1.2",
      headers: {
        Authorization: `Token ${this.token}`,
        "Content-Type": "application/json",
        "Accept-Language": "en_US"
      }
    });

    this.getMotorBikePrice = this.getMotorBikePrice.bind(this);
    this.getDriverEstimatedTimeOfArrival = this.getDriverEstimatedTimeOfArrival.bind(
      this
    );
    this.getRequestsEstimate = this.getRequestsEstimate.bind(this);
  }

  getMotorBikePrice(start = {}, end = {}) {
    const payload = {
      start_latitude: start.lat,
      start_longitude: start.long,
      end_latitude: end.lat,
      end_longitude: end.long
    };

    return this.axios
      .get(`/estimates/price?${queryString.stringify(payload)}`)
      .then(response => {
        const uberMotor = response.data.prices.filter(
          item => item.product_id == this.uberMotorProductId
        )[0];

        return {
          price: {
            fixed: uberMotor.high_estimate == uberMotor.low_estimate,
            high: uberMotor.high_estimate,
            low: uberMotor.low_estimate
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

  getRequestsEstimate(auth, start = {}, end = {}) {
    const payload = {
      product_id: this.uberMotorProductId,
      start_latitude: start.lat,
      start_longitude: start.long,
      end_latitude: end.lat,
      end_longitude: end.long
    };

    return this.axios
      .post("/requests/estimate", payload, {
        headers: {
          Authorization: `Bearer ${auth}`
        }
      })
      .then(response => response.data);
  }
};
