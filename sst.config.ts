import { SSTConfig } from "sst";
import { API } from "./stacks/API";
import { Bus } from "./stacks/BUS";
import { BUCKET } from "./stacks/Bucket";

export default {
  config(_input) {
    return {
      name: "invoicer-sst",
      region: "eu-west-3",
    };
  },
  stacks(app) {
    app.stack(BUCKET).stack(Bus).stack(API);
  },
} satisfies SSTConfig;
