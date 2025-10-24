import { ModifiedClient } from "../../types/helpers";

module.exports = (client: ModifiedClient, rateLimitData: any) => {
    console.log(JSON.stringify(rateLimitData).grey.italic.dim);
}
