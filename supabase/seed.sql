-- Big Move — starter checklist (Oct 2026 → Mar 2027)
-- Run once after schema.sql. Safe to edit or delete any of these in the app.

insert into public.tasks (title, category, due_date, owner, priority, notes) values
-- October 2026: decide and prepare
('Agree overall budget range for London flat + country house', 'Finance', '2026-10-09', 'Both', 'high', 'Depends on Fulham sale price and any mortgage.'),
('Get 3 estate agent valuations for the Fulham house', 'Selling', '2026-10-16', 'Gareth', 'high', null),
('Speak to mortgage broker about borrowing / bridging options', 'Finance', '2026-10-16', 'Gareth', 'normal', null),
('Get SDLT / LTT advice on buying two properties (second-home surcharge)', 'Finance', '2026-10-23', 'Gareth', 'high', null),
('Decide target areas for London flat', 'Buying', '2026-10-23', 'Both', 'normal', null),
('Decide target areas for country house / cottage', 'Buying', '2026-10-23', 'Both', 'normal', null),
('Walk through every room and list possessions in the app', 'Possessions', '2026-10-31', 'Both', 'high', 'Tag each item London / country / storage / sell / donate / dispose.'),
('Instruct selling agent and agree fee', 'Selling', '2026-10-30', 'Both', 'high', null),
('Instruct conveyancing solicitor (sale)', 'Legal', '2026-10-30', 'Gareth', 'high', null),

-- November 2026: market the house, declutter, start viewing
('Prepare house for photos (declutter, repairs, garden)', 'Selling', '2026-11-06', 'Both', 'normal', null),
('Order EPC if current one has expired', 'Selling', '2026-11-06', 'Gareth', 'normal', null),
('Complete TA6 / TA10 property information forms', 'Legal', '2026-11-13', 'Gareth', 'normal', null),
('Book first round of London flat viewings', 'Buying', '2026-11-13', 'Both', 'normal', null),
('Book first round of country property viewings', 'Buying', '2026-11-20', 'Both', 'normal', null),
('Sell high-value items not coming with us (auction / dealers)', 'Possessions', '2026-11-27', 'Kristin', 'normal', null),
('Get 3 quotes for long-term storage', 'Storage', '2026-11-27', 'Kristin', 'normal', null),
('Get 3 quotes from removal firms (split load: flat / country / storage)', 'Removals', '2026-11-27', 'Kristin', 'high', null),

-- December 2026: offers and decisions
('Review offers on Fulham house', 'Selling', '2026-12-11', 'Both', 'high', null),
('Shortlist top 3 London flats and top 3 country properties', 'Buying', '2026-12-11', 'Both', 'normal', null),
('Charity collection / donation run #1', 'Possessions', '2026-12-18', 'Kristin', 'normal', null),

-- January 2027: buy and book
('Make offers on chosen properties', 'Buying', '2027-01-15', 'Both', 'high', null),
('Instruct solicitor for purchase(s)', 'Legal', '2027-01-15', 'Gareth', 'high', null),
('Book surveys on purchases', 'Buying', '2027-01-22', 'Gareth', 'normal', null),
('Book removal firm provisionally for March', 'Removals', '2027-01-29', 'Kristin', 'high', null),
('Book storage unit', 'Storage', '2027-01-29', 'Kristin', 'normal', null),
('Buy packing materials (boxes, tape, labels, bubble wrap)', 'Removals', '2027-01-31', 'Kristin', 'normal', null),

-- February 2027: pack and admin
('Pack non-essentials room by room (label boxes to match the app)', 'Possessions', '2027-02-12', 'Both', 'high', null),
('Charity collection / donation run #2', 'Possessions', '2027-02-12', 'Kristin', 'normal', null),
('Book tip / clearance for items to dispose', 'Possessions', '2027-02-19', 'Gareth', 'normal', null),
('Set up utilities, broadband and council tax at new addresses', 'Admin', '2027-02-19', 'Gareth', 'normal', null),
('Arrange Royal Mail redirection', 'Admin', '2027-02-26', 'Kristin', 'normal', null),
('Update address: banks, HMRC, DVLA, GP, dentist, insurers, subscriptions', 'Admin', '2027-02-26', 'Both', 'normal', null),
('Arrange buildings & contents insurance for new properties', 'Admin', '2027-02-26', 'Gareth', 'high', null),
('Exchange contracts and fix completion dates', 'Legal', '2027-02-26', 'Both', 'high', null),

-- March 2027: move
('Confirm removal dates and parking suspension in Fulham', 'Removals', '2027-03-05', 'Kristin', 'high', null),
('Final meter readings and cancel Fulham utilities', 'Admin', '2027-03-12', 'Gareth', 'normal', null),
('Pack essentials box for each property', 'Possessions', '2027-03-12', 'Both', 'normal', null),
('Moving day', 'Removals', '2027-03-19', 'Both', 'high', null),
('Clean Fulham house and hand over keys', 'Selling', '2027-03-20', 'Both', 'normal', null),
('Check storage inventory matches the app', 'Storage', '2027-03-27', 'Kristin', 'normal', null);

insert into public.budget_items (label, section, direction, estimate) values
('Fulham house sale price', 'Sale proceeds', 'in', null),
('Mortgage redemption (if any)', 'Sale proceeds', 'out', null),
('Estate agent fee', 'Sale proceeds', 'out', null),
('Sale conveyancing', 'Sale proceeds', 'out', null),
('London flat purchase price', 'London purchase', 'out', null),
('London SDLT', 'London purchase', 'out', null),
('London conveyancing + survey', 'London purchase', 'out', null),
('Country purchase price', 'Country purchase', 'out', null),
('Country SDLT or Welsh LTT (incl. second-home surcharge)', 'Country purchase', 'out', null),
('Country conveyancing + survey', 'Country purchase', 'out', null),
('Removals', 'Moving costs', 'out', null),
('Packing materials', 'Moving costs', 'out', null),
('Storage (monthly × months)', 'Storage', 'out', null);
