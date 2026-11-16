(()=>{
  'use strict';
  const frame=document.getElementById('booking-engine'),status=document.getElementById('booking-page-status');
  try{
    const url=new URL(window.GULPLAJ_BOOKING_CONFIG.bookingUrl);
    if(url.protocol!=='https:'||url.hostname!=='gulplaj-hotel.hotelrunner.com'||url.username||url.password)throw Error('Invalid booking origin');
    frame.addEventListener('load',()=>{status.hidden=true;});
    // No card or guest details are read by our scripts. The official engine
    // submits the reservation and controls its actual confirmation status.
    frame.src=url.href;
  }catch{
    frame.hidden=true;status.textContent='Rezervasyon ekranı şu anda açılamıyor. Yardım için oteli arayabilirsiniz.';
  }
})();
