import { SSTConfig } from "sst";
import { API } from "./stacks/API";
import { Bus } from "./stacks/BUS";

export default {
  config(_input) {
    return {
      name: "invoicer-sst",
      region: "eu-west-3",
    };
  },
  stacks(app) {
    app.stack(Bus).stack(API);
  },
} satisfies SSTConfig;
