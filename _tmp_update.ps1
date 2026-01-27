 = @{
  'ricardo-zanetti-gomes'='ChIJKfDO9hkb6JQRioSatPPWgE0'
  'rubens-sirtoli-filho'='ChIJg8DRLusb6JQRM-AElkF15D8'
  'marcelo-valladao-ferreira-carvalho'='ChIJg8DRLusb6JQRM-AElkF15D8'
  'liliana-elias-pena-pilatti'='ChIJeRSNoRwb6JQRXLmBwUg7w_E'
  'victor-mauro'='ChIJ0XFz2lwa6JQRptVvp1jo6Y4'
  'magno-zanellato'='ChIJe81nM2Ib6JQR68cV4jq_WGE'
  'bruno-figueiredo-pancan'='ChIJ7WIdse8b6JQRlj08Im-8A10'
  'alexandre-barao-acuna'='ChIJFXJz2lwa6JQR5mp-2VacS8c'
  'cesar-toshio-oda'='ChIJsZbOvwUa6JQR9B2EBx_JsUI'
  'daniel-seiti-kurihara-oda'='ChIJsZbOvwUa6JQR9B2EBx_JsUI'
}
 = 'ChIJY9wtc-ob6JQRtSYIa7PpR9A'
 = @('daniel-cartelli','luis-felipe-villas-boas','rodrigo-caldonazzo-favaro','rafael-pancan-de-biaggi','franklin-roberto-hilgemberg','marina-claudia-polydoro','carlos-eduardo-miers-gruhl')
 = Get-Content data/doctors.json -Raw | ConvertFrom-Json
foreach( in .doctors){
  if(.ContainsKey(.slug)){
    if(-not .google){ | Add-Member -NotePropertyName google -NotePropertyValue (@{})}
    .google.placeId = [.slug]
  } elseif( -contains .slug){
    if(-not .google){ | Add-Member -NotePropertyName google -NotePropertyValue (@{})}
    .google.placeId = 
  }
}
 | ConvertTo-Json -Depth 20 | Set-Content data/doctors.json
