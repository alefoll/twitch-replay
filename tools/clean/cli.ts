import { deleteSync } from "del";
import path from "path";

const distPath = path.resolve(__dirname, "../../dist/*");

deleteSync([distPath]);
