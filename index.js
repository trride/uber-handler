const Axios = require("axios");
const queryString = require("query-string");

module.exports = class UberHandler {
  constructor(config) {
    this.token = config.token || "";

    this.axios = Axios.create({
      baseURL: "https://api.uber.com/v1.2",
      headers: {
        Authorization: `Token ${this.token}`,
        "Content-Type": "application/json",
        "Accept-Language": "en_US"
      }
    });

    this.getMotorBikePrice = this.getMotorBikePrice.bind(this);
  }

  getMotorBikePrice(start, end) {
    const payload = {
      start_latitude: start.lat,
      start_longitude: start.long,
      end_latitude: end.lat,
      end_longitude: end.long
    };

    return this.axios
      .get(`/estimates/price?${queryString.stringify(payload)}`)
      .then(response => {
        const uberMotorProductId = "89da0988-cb4f-4c85-b84f-aac2f5115068"; //uberMotor
        const uberMotor = response.data.prices.filter(
          item => item.product_id == uberMotorProductId
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
};
