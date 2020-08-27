function parseString(string) {
  const data = [];
  function getData() {
    const length = parseInt(string.split("/", 1)[0]);

    if (Number.isNaN(length)) {
      return;
    }

    const name = string.substring(
      length.toString().length + 1,
      length.toString().length + 1 + length
    );

    string = string.substring(length.toString().length + 1 + length);
    
    const end = string.split(":")[0].indexOf(",") + 1;


    const indices = end
      ? string.split(",", 1)[0].split(".")
      : string.split(":", 1)[0].split(".");

    data.push([
      name,
      indices
    ]);

    string = string.substring(indices.join(".").length + 1);

    return end;
  }
  
  let stop;
  while (stop = getData()) {
    if (!stop) {
      break;
    }
  }

  return [
    string,
    data
  ];
}

function parseName(string) {
  if (string.indexOf("/")) {
    return string.split("/")[1].repeat(
      parseInt(string.split("/")[0])
    );
  } else {
    return string.substring(1);
  }
}

function splice(string, index, newString) {
  return (
    string.slice(0, index) +
    newString +
    string.slice(index)
  );
}

async function decompress(string) {
  if (typeof string !== "string") {
    throw new TypeError("Invalid arguments passed");
  }

  string = parseString(string);

  const data = string[1];
  string = string[0];

  data.forEach(array => {
    const name = parseName(array[0]), indices = array[1];
    indices.reverse();

    indices.forEach(index => {
      string = splice(string, index, name);
    });
  });

  return string;
}

export default decompress;