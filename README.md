sdReadWrite
===========

A node.js script to write/read files from the arduino sdcard through the serial port.

**Requirements:**

- [node.js](https://github.com/joyent/node)

**Installation:**

- npm install
- mkdir downloads
- git submodule update
- cd libraries && git submodule update
- Upload sdReadWrite.ino to your arduino.

**Usage:**

- To read: ./sdReadWrite.js R filename [-p path] [--serial serialPort]
- To write: ./sdReadWrite.js W filename [-p path] [--serial serialPort]

**License:**

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the [GNU General Public License](https://github.com/dEsteban/sdReadWrite/blob/master/LICENSE)
along with this program. If not, see <http://www.gnu.org/licenses/>.
