/**
 * 自定义图形块
 */
//% weight=100 color=#0855AA icon="O" block="matriaxpanel_max7219""
namespace  matrixpanel_max7219_spi {
    /* We keep track of the led-status for all 8 devices in this array */
    let status:uint8[] =[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    /* The array for shifting the data to the devices */
    let spi_data:number[]=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    /* The maximum number of devices we use */
    let max_devices:number;
    //the opcodes for the MAX7221 and MAX7219
    let OP_NOOP       = 0;
    let OP_DIGIT0     = 1;
    let OP_DIGIT1     = 2;
    let OP_DIGIT2     = 3;
    let OP_DIGIT3     = 4;
    let OP_DIGIT4     = 5;
    let OP_DIGIT5     = 6;
    let OP_DIGIT6     = 7;
    let OP_DIGIT7     = 8;
    let OP_DECODEMODE = 9;
    let OP_INTENSITY  = 10;
    let OP_SCANLIMIT  = 11;
    let OP_SHUTDOWN   = 12;   
    let OP_DISPLAYTEST= 15;  
    /* Data is shifted out of this pin*/
    let spi_mosi:DigitalPin;
    /* The clock is signaled on this pin */
    let spi_clk:DigitalPin;
    /* This one is driven LOW for chip selectzion */
    let spi_cs:DigitalPin;
    let global_val:uint8;
           
    /* Send out a single command to the device */
    function spi_transfer(addr: number,opcode: number, data: number):void{
        //Create an array with the data to shift out
        let offset=addr*2;
        let maxbytes=max_devices*2;
        for(let i=0;i<maxbytes;i++)
        spi_data[i]=0;
        //put our device data into the array
        spi_data[offset+1]  = opcode;
        spi_data[offset]    = data;
        pins.digitalWritePin(spi_cs, 0);
        for(let i=maxbytes;i>0;i--)
            pins.spiWrite(spi_data[i-1]);
        pins.digitalWritePin(spi_cs, 1);
    }
    /* 
    * Create a new controler 
    * Params :
    * dain		    pin on the microbit where data gets shifted out
    * clk		    pin for the clock
    * cs		    pin for selecting the device 
    * num_devices	maximum number of devices that can be controled
    */
   export function matrixpanel_init(din: DigitalPin, clk:DigitalPin, cs: DigitalPin, num_devices: number):void{
        let spi_miso:DigitalPin;
        spi_mosi = din;
        spi_miso = DigitalPin.P14
        spi_clk=clk;
        spi_cs=cs;
        if(num_devices<=0 || num_devices>8)
        num_devices=8;
        max_devices=num_devices;
        // spi config 
        pins.spiFormat(8,3);
        pins.spiFrequency(1000000);
        pins.spiPins(spi_mosi, DigitalPin.P0, spi_clk)
        pins.digitalWritePin(spi_cs, 1);

        for(let i=0;i<64;i++) 
            status[i]=0x00;
        for(let i=0;i<max_devices;i++) {
            spi_transfer(i,OP_DISPLAYTEST,0);
            //scanlimit is set to max on startup
            set_scan_limit(i,7);
            //decode is done in source
            spi_transfer(i,OP_DECODEMODE,0);
            clear_display(i);
            //we go into shutdown-mode on startup
            power_save(i,true);
        }
    }
    /*
    * Gets the number of devices attached to this matrixpanel.
    * Returns :
    * int	the number of devices of matrixpanel 
     */
    export function get_device_count():number{
        return max_devices;
    }
    /* 
    * Set the number of digits (or rows) to be displayed.
    * See datasheet for sideeffects of the scanlimit on the brightness
    * of the display.
    * Params :
    * addr	address of the display to control
    * limit	number of digits to be displayed (1..8)
    */
    function set_scan_limit(addr:number, limit:number): void{
        if(addr<0 || addr>=max_devices)
        return;
        if(limit>=0 || limit<8)
        spi_transfer(addr, OP_SCANLIMIT,limit);
    }
    
    /* 
    * Set the power_save (power saving) mode for the device
    * Params :
    * addr	    The address of the display to control
    * cmd	If true the device goes into power-down mode. Set to false
    *		for normal operation.
    */
   export function power_save(addr:number, cmd:boolean): void{
        if(addr<0 || addr>=max_devices)
        return;
        if(cmd)
        spi_transfer(addr, OP_SHUTDOWN,0);
        else
        spi_transfer(addr, OP_SHUTDOWN,1);
    }
    /* 
    * Set the brightness of the display.
    * Params:
    * addr		the address of the display to control
    * intensity	the brightness of the display. (0..15)
    */
   export function set_intensity(addr:number, intensity:number):void{
        if(addr<0 || addr>=max_devices)
        return;
        if(intensity>=0 || intensity<16)	
        spi_transfer(addr, OP_INTENSITY,intensity);
    }
    /* 
     * Switch all Leds on the display off. 
     * Params:
     * addr	address of the display to control
     */
    export function clear_display(addr:number) {
        let offset:number;
        if(addr<0 || addr>=max_devices)
        return;
        offset=addr*8;
        for(let i=0;i<8;i++) {
            status[offset+i]=0;
            spi_transfer(addr, i+1,status[offset+i]);
        }
    }
    /* 
    * Set the status of a single Led.
    * Params :
    * addr	address of the display 
    * row	the row of the Led (0..7)
    * col	the column of the Led (0..7)
    * state	If true the led is switched on, 
    *		if false it is switched off
    */
   export function set_led(addr:number,row:number, col:number, state:number): void{
        let offset:number;
        global_val = 0x00;
        if(addr<0 || addr>=max_devices)
        return;
        if(row<0 || row>7 || col<0 || col>7)
        return;
        offset=addr*8;
        
    
        if(state){
        global_val= 0x80 >> col;
        status[offset+row]=status[offset+row]|global_val;
        }
        else {
        global_val = (0x01 << col);//global_val;
        status[offset+row]=status[offset+row]&global_val;
        }
        spi_transfer(addr, row+1,status[offset+row]);
    }
    /* 

    * Set all 8 Led's in a row to a new state
    * Params:
    * addr	address of the display
    * row	row which is to be set (0..7)
    * value	each bit set to 1 will light up the
    *		corresponding Led.
    */
   export function set_row(addr:number,row:number, value:number): void{
        let offset:number;
        if(addr<0 || addr>=max_devices)
        return;
        if(row<0 || row>7)
        return;
        offset=addr*8;
        status[offset+row]=value;
        spi_transfer(addr, row+1,status[offset+row]);
    }
    /* 
    * Set all 8 Led's in a column to a new state
    * Params:
    * addr	address of the display
    * col	column which is to be set (0..7)
    * value	each bit set to 1 will light up the
    *		corresponding Led.
    */
   export function set_col(addr:number,col:number, value:number): void{
        let val:number;
        if(addr<0 || addr>=max_devices)
        return;
        if(col<0 || col>7) 
        return;
        for(let row=0;row<8;row++) {
        val=value >> (7-row);
        val=val & 0x01;
        set_led(addr,row,col,val);
        }
    }
}
