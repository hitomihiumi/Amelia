import {ModifiedClient} from "../../types/helpers";

module.exports = (client: ModifiedClient, error: any) => {
    console.log(String(error).yellow.dim);
}
