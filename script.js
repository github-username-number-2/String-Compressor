import compress from "./compress.js";
import decompress from "./decompress.js";

/*
r
  repeating value
  ads111dgh111d111fn > 111

i
  interval
  is1f1a1j1n1i1y1abda > 1

format
  1: compression string
  2: remaining string
    kdjbahfb
  
  final: 1:2

compression string format
  1: compression type
  2: compression info

  final: 1:2,
*/