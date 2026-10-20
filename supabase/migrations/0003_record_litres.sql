-- Litres for fuel entries, so fuel economy (km per litre) can be worked out later.
alter table records add column litres numeric(6, 2) check (litres > 0);
