import { ModifiedClient } from "../../types/helpers";

module.exports = (client: ModifiedClient, info: any) => {
    console.log(String(info).grey);
}
