!function () {
	const isBrowser = new Function("try{return this===window;}catch(e){return false;}")();

	Object.defineProperty(isBrowser ? window : global, "CL", {
		value: {},
		writable: false
	});

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


			const indices = end ?
				string.split(",", 1)[0].split(".") :
				string.split(":", 1)[0].split(".");

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

	async function getCompressedValue(value) {
		const compress = await getOccString(value, value[0]) === value.length;

		return compress ? value.length + "/" + value[0] : "/" + value;
	}

	function getOcc(array, value) {
		return array.filter(v => v === value).length;
	}

	async function getOccString(string, value) {
		return string.split(value).length - 1;
	}

	function splitAtN(length, string) {
		return string.match(new RegExp(`.{${length}}`, "g"));
	}

	async function toFormatted(value, string, data) {
		const occurrences = await getOccString(string, value),
			indexArray = [];

		for (let i = 0; i < occurrences; i++) {
			indexArray.push(string.indexOf(value));
			string = string.replace(value, "");
		}

		const name = await getCompressedValue(value);

		if (data) {
			let tmpString = "";
			data.forEach(array => {
				tmpString += `,${array[0].length}/${array[0] + array[1].join(".")}`;
			});
			return `${name.length}/${name}${indexArray.join(".")}${tmpString}:${string}`;
		} else {
			return `${name.length}/${name}${indexArray.join(".")}:${string}`;
		}
	}

	async function recompress(string, preFormatted, options, compressNum, compressPower) {
		const defString = string,
			defLength = string.length;

		let data;
		if (preFormatted) {
			data = parseString(string);
			string = data[0];
			data = data[1];
		}
		const searchArray = (function () {
			let searchLen = 2,
				storedProgress;
			const searchArray = [];

			function getLength(string) {
				return options.searchLength === "full" ?
					Math.floor(string.length / 2) :
					Math.min(options.searchLength, Math.floor(string.length / 2));
			}

			for (let i = 0, l = getLength(string); i < l; i++) {
				for (let i2 = 0; i2 < searchLen; i2++) {
					const search = splitAtN(searchLen, string.substring(i2));
					search && searchArray.push(search);
				}

				const progress = Math.floor(i / l * 100);
				if (progress !== storedProgress) {
					options.progressUpdate("searching", progress, compressNum, compressPower);
					storedProgress = progress;
				}

				searchLen++;
			}
			options.progressUpdate("searching", 100, compressNum, compressPower);

			return searchArray;
		})();

		let storedProgress, minLen, minVal, first;

		for (let i = 0, l = searchArray.length; i < l; i++) {
			const searchLen = searchArray[i].length;
			let storedProgress2;

			let i2 = 0;
      for (const searchValue of searchArray[i]) {
        if (!first) {
          minVal = await toFormatted(searchValue, string, data);
          minLen = minVal.length;
  				first = true;
        }
        const formatted = await toFormatted(searchValue, string, data);
        if (formatted.length < minLen) {
          minLen = formatted.length;
          minVal = formatted;
        }

				const progress = Math.floor((i2++) / searchLen * 100);
				if (progress !== storedProgress2) {
					defLength > 6000 && options.progressUpdate(`formatting section ${i}/${l}`, progress, compressNum, compressPower);
					storedProgress2 = progress;
				}
			};
      defLength > 6000 && options.progressUpdate(`formatting section ${l}/${l}`, 100, compressNum, compressPower);


			const progress = Math.floor(i / l * 100);
			if (progress !== storedProgress) {
				options.progressUpdate("formatting", progress, compressNum, compressPower);
				storedProgress = progress;
			}
		};
		options.progressUpdate("formatting", 100, compressNum, compressPower);

		return minVal
	}

	const defOptions = {
		searchLength: "full",
		progressUpdate: () => {}
	};

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

	CL.compress = async function (string, options) {
		if (typeof string !== "string") {
			throw new TypeError("Invalid arguments passed");
		}
		if (string.length < 3) {
			throw new RangeError("String is too small");
		}
		if (!options) {
			options = defOptions;
		} else {
			for (const key in defOptions) {
				if (!options.hasOwnProperty(key)) {
					options[key] = defOptions[key];
				}
			}
		}

		const defString = string,
			defLength = string.length;

		//important
		let formattedString, pastString, compressed = false,
			compressNum = 0;
		while (formattedString =
			await recompress(
				formattedString || string,
				compressed,
				options,
				compressNum++,
				defString.length -
				(formattedString ?
					formattedString.length :
					defString.length))) {

			if (defString.length <= formattedString.length ||
				pastString &&
				pastString.length <= formattedString.length) {

				break;
			}

			pastString = formattedString;

			compressed = true;
		}

    const value = pastString ? pastString : formattedString;

    const returnVal = {
			value,
			compressed,
			compressionPower: defString.length - value.length
		};

		return returnVal;
	}

	CL.decompress = function (string) {
		if (typeof string !== "string") {
			throw new TypeError("Invalid arguments passed");
		}

		string = parseString(string);

		const data = string[1];
		string = string[0];

		data.forEach(array => {
			const name = parseName(array[0]),
				indices = array[1];
			indices.reverse();

			indices.forEach(index => {
				string = splice(string, index, name);
			});
		});

		return string;
	}

  if (!isBrowser) {
    exports.compress = CL.compress;
    exports.decompress = CL.decompress;
  }
}();