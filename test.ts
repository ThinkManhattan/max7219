// tests go here; this will not be compiled when this package is used as a library
let devices:number;
matrixpanel_max7219_spi.matrixpanel_init(DigitalPin.P15,DigitalPin.P13,DigitalPin.P1,1);
devices=matrixpanel_max7219_spi.get_device_count();
//we have to init all devices in a loop
for(let address=0;address<devices;address++) {
    /*The MAX72XX is in power-saving mode on startup*/
    matrixpanel_max7219_spi.power_save(address,false);
    /* Set the brightness to a medium values */
    matrixpanel_max7219_spi.set_intensity(address,8);
    /* and clear the display */
    matrixpanel_max7219_spi.clear_display(address);
  }
basic.forever(() => {
  //we have to init all devices in a loop
  for(let row=0;row<8;row++) {
    for(let col=0;col<8;col++) {
      for(let address=0;address<devices;address++) {
        basic.pause(500);
        matrixpanel_max7219_spi.set_led(address,row,col,1);
        basic.pause(500);
        matrixpanel_max7219_spi.set_led(address,row,col,0);
      }
    }
  }
    
})

