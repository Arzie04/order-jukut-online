# Google Integration Reference

Dokumen ini menyimpan referensi Google Apps Script dan Google Form yang dipakai aplikasi order.

## Apps Script

`APPS_SCRIPT_URL`

```text
https://script.google.com/macros/s/AKfycbxe5xK7fOwhC2Z4Z3khcjZ5n0N3e_-qsXwigNPeHXyDtFu2aXZqon3aIdI58Aqkciej/exec
```

## Google Form

Source prefilled URL:

```text
https://docs.google.com/forms/d/e/1FAIpQLSceaYNjewOa6lWgeab7Zo-pkJ7WUBnox9C8DQ3HX9lh8E5IeQ/viewform?usp=pp_url&entry.1756210992=NAMA+DISINI&entry.794602475=PESANAN+DISINI&entry.1229878423=NOTE+DISINI&entry.39066530=TOTAL+PEMBAYARAN+DISINI&entry.137521316=NO+ORDER+DISINI
```

Form response URL yang dipakai untuk submit:

```text
https://docs.google.com/forms/d/e/1FAIpQLSceaYNjewOa6lWgeab7Zo-pkJ7WUBnox9C8DQ3HX9lh8E5IeQ/formResponse
```

## Extracted Field IDs

- `FORM_FIELD_NAMA=entry.1756210992`
- `FORM_FIELD_PESANAN=entry.794602475`
- `FORM_FIELD_NOTE=entry.1229878423`
- `FORM_FIELD_TOTAL=entry.39066530`
- `FORM_FIELD_NO_ORDER=entry.137521316`

## Vercel Environment Variables

```env
APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbxe5xK7fOwhC2Z4Z3khcjZ5n0N3e_-qsXwigNPeHXyDtFu2aXZqon3aIdI58Aqkciej/exec
GOOGLE_FORM_URL=https://docs.google.com/forms/d/e/1FAIpQLSceaYNjewOa6lWgeab7Zo-pkJ7WUBnox9C8DQ3HX9lh8E5IeQ/formResponse
FORM_FIELD_NAMA=entry.1756210992
FORM_FIELD_PESANAN=entry.794602475
FORM_FIELD_NOTE=entry.1229878423
FORM_FIELD_TOTAL=entry.39066530
FORM_FIELD_NO_ORDER=entry.137521316
```

## Notes

- `viewform` dipakai untuk melihat form di browser.
- `formResponse` dipakai aplikasi untuk kirim data ke Google Form.
- Variable `NEXT_PUBLIC_*` tidak perlu diisi untuk setup server-side yang sekarang.
