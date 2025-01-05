import { SSTConfig } from "sst";
import { API } from "./stacks/API";

export default {
  config(_input) {
    return {
      name: "invoicer-sst",
      region: "eu-west-3",
    };
  },
  stacks(app) {
    app.stack(API);
  },
} satisfies SSTConfig;
