requrie('dotenv').config()
const Axios = require("axios");
const queryString = require("query-string");

module.exports = class UberHandler {
  constructor(config) {
    this.service_name = "uber";
    this.token = config.token || "";
    this.access_token = config.access_token || "";
    this.sandbox = config.sandbox || false;
    this.baseURL = process.env.NODE_ENV == 'development' ? process.env.DEV_BASE_URL + '/uber' : this.sandbox
      ? "https://sandbox-api.uber.com/v1.2"
      : "https://api.uber.com/v1.2";

    this.uberMotorProductId = "89da0988-cb4f-4c85-b84f-aac2f5115068";

    this.axios = Axios.create({
      baseURL: this.baseURL,
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
    this.cancelRide = this.cancelRide.bind(this);
    this.cancelCurrentRide = this.cancelCurrentRide.bind(this);
    this.rideStatus = this.rideStatus.bind(this);
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
        service: this.service_name,
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
          service: this.service_name,
          requestId: response.data.request_id
        }
      });
  }

  rideStatus(requestId) {
    return this.axios
    .get(`/requests/${requestId}`)
    .then(response => {
      const { data } = response
      
      const driver = data.driver && data.vehicle && {
        name: data.driver.name,
        rating: data.driver.rating,
        pictureUrl: data.driver.picture_url,
        phoneNumber: data.driver.phone_number,
        vehicle: {
          plate: data.vehicle.license_plate,
          name: data.vehicle.make + data.vehicle.model
        }
      }

      const payload = {
        service: this.service_name,
        requestId: data.request_id,
        driver
      }

      const result = {
        'processing': {
          status: 'processing',
          ...payload
        },
        'no_drivers_available': {
          status: 'not_found',
          ...payload
        },
        'accepted': {
          status: 'accepted',
          ...payload
        },
        'driver_canceled': {
          status: 'canceled',
          ...payload
        },
        'rider_canceled': {
          status: 'canceled',
          ...payload
        },
        'in_progress': {
          status: 'on_the_way',
          ...payload
        },
        'completed': {
          status: 'completed',
          ...payload
        }
      }

      return result[data.status]
    })
  }

  cancelCurrentRide() {
    return this.axios
    .delete("/requests/current")
    .then(response => {
      return {
        service: this.service_name,
        canceled: true
      }
    })
  }

  cancelRide(requestId) {
    return this.axios
      .delete(`/requests/${requestId}`)
      .then(response => {
        return {
          service: this.service_name,
          canceled: true
        }
      })
  }
};
