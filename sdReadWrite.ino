#include <SD.h>

#define WRITE_MODE 0
#define READ_MODE 1

char path[255];
byte path_index = 0;
bool connected = 0;
bool first_contact = 0;
byte mode = 0;
File file;
long size;
byte buffer[512];
int buffer_index;

void setup() {	
	SD.begin();
	Serial.begin(115200);
	Serial.write(0);
}

char * getPathDir(char * path) {
	String str = path;
	str = str.substring(0, str.lastIndexOf('/') + 1);
	char * dir = (char *) malloc(sizeof(char) * str.length());
	str.toCharArray(dir, str.length() + 1);
	return dir;
}

void loop(void) {
	if(!Serial.available()) return;
	byte read = Serial.read();
	if(!connected) {
		if(read != '\n') {
			path[path_index] = read;
			path_index++;
		} else {
			while(!Serial.available()) { delay(1); }
			mode = Serial.read();
			char * dir;
			switch(mode) {
				case WRITE_MODE:
					while(Serial.available() < 3) { delay(1); }
					size = Serial.read() + ((long) Serial.read() << 8) + ((long) Serial.read() << 16);
					SD.remove(path);
					dir = getPathDir(path);
					if(strcmp(dir, "/") != 0) SD.mkdir(dir);
					file = SD.open(path, FILE_WRITE);
					Serial.write(0);
				break;
				case READ_MODE:
					file = SD.open(path);
					size = file.size();
					Serial.write(size & 0xff);
					Serial.write((size >> 8) & 0xff);
					Serial.write((size >> 16) & 0xffff);
			}
			buffer_index = 0;
			connected = true;
		}
	} else {
		if(size > 0) {
			switch(mode) {
				case WRITE_MODE:
					buffer[buffer_index] = read;
					size--;
					buffer_index++;
					if(buffer_index == 512 || size == 0) {
						file.write(buffer, buffer_index);
						buffer_index = 0;
						Serial.write(0);
					}		
				break;
				case READ_MODE:
					int bufferSize = size < 512 ? size : 512;
					file.read(buffer, bufferSize);
					for(int x=0; x<bufferSize; x++) Serial.write(buffer[x]);
					size -= bufferSize;
			}
		} else {
			file.close();
			for(int x=0; x<512; x++) path[x] = NULL;
			connected = false;
			Serial.write(1);
		}
	}
}
