import { ModalField } from "../../src/helpers/canvas/ModalField";

const modalFieldShort = new ModalField({
  id: "input1",
  name: "Short Input",
  placeholder: "Enter short text here...",
  type: "short",
  required: true,
});

const modalFieldLong = new ModalField({
  id: "input2",
  name: "Long Input",
  placeholder: "Enter long text here...",
  type: "long",
  required: false,
  min: 10,
  max: 200,
});

modalFieldShort.render().then((buffer) => {
  require("fs").writeFileSync("modalFieldShort.png", buffer);
});

modalFieldLong.render().then((buffer) => {
  require("fs").writeFileSync("modalFieldLong.png", buffer);
});
