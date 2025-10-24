import { ModifiedClient } from "../../types/helpers";

module.exports = (client: ModifiedClient) => {
    console.log(`Reconnceting at ${new Date()}.`.bgYellow.black)
}
