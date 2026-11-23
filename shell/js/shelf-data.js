// What's on the bookshelf: Cameron's books (his shortlist, from his Goodreads) and his
// all-time favourite films (his Letterboxd list). Covers and posters load from
// Open Library and TMDB (both let the room paint them onto the books and cases);
// `logo` is the film's title treatment, printed down its spine (null: plain type);
// `backdrop` (Letterboxd) is the card's background, `synopsis` from TMDB / Letterboxd. `note` is Cam's own take: MZALA reads it out when
// you open the book or film (leave it '' and he says something general).
//
// Covers: a modern edition each (a Penguin one where there is one). `spine`: `crop` is where the
// title sits on the cover (x, y, w, h as fractions): it's cut out and runs down the spine, like the
// films' logos; `text` prints the title instead, in the cover's colours and type.
//
// status: 'read' | 'currently-reading' | 'to-read'; rating: Cam's stars (0 = none)
export const BOOKS = [
 {
  "id": "37781",
  "title": "Things Fall Apart",
  "about": "Okonkwo is a celebrated wrestler and farmer in the Igbo village of Umuofia, a man driven by the fear of ending up like his weak father. As his own stubbornness costs him his place in the clan, British missionaries and colonial government arrive, and the world he fought to master starts to come apart.",
  "author": "Chinua Achebe",
  "year": 1958,
  "pages": 215,
  "status": "read",
  "rating": 4,
  "cover": "https://images.penguinrandomhouse.com/cover/9780385474542",
  "spine": { crop: [0.04, 0.13, 0.92, 0.1] },
  "note": ""
 },
 {
  "id": "14569052",
  "title": "Purple Hibiscus",
  "about": "Fifteen-year-old Kambili grows up in a wealthy Enugu household ruled by her father, a devout Catholic whose public generosity hides private cruelty. A stay with her free-thinking aunt in Nsukka, amid Nigeria's political turmoil, shows her and her brother a life full of laughter and choice, and changes them both.",
  "author": "Chimamanda Ngozi Adichie",
  "year": 2003,
  "pages": 336,
  "status": "currently-reading",
  "rating": 0,
  "cover": "https://covers.openlibrary.org/b/isbn/9780007189885-L.jpg",
  "spine": { text: true, bg: '#1c1416', ink: '#d39a98', font: "400 {s}px Georgia, 'Times New Roman', serif", accent: '#cfc6c0' },
  "note": ""
 },
 {
  "id": "59236786",
  "title": "Children of Sugarcane",
  "about": "In 1890s colonial India, Shanti flees a brutal marriage and signs on as an indentured labourer bound for the sugarcane fields of Natal. In South Africa she endures the plantations' harsh system and fights to survive and hold on to herself, in a story drawn from the history of Indian indentured workers.",
  "author": "Joanne Joseph",
  "year": 2021,
  "pages": 358,
  "status": "read",
  "rating": 4,
  "cover": "https://covers.openlibrary.org/b/id/13883978-L.jpg",
  "spine": { text: true, bg: '#e9c64e', ink: '#c3202f', font: "700 {s}px Georgia, 'Times New Roman', serif", accent: '#2a2216' },
  "note": ""
 },
 {
  "id": "1768603",
  "title": "The White Tiger",
  "about": "Balram Halwai, a boy from a poor village, becomes chauffeur to a rich family in Delhi, and tells his story in letters to a visiting Chinese premier. With sharp, dark humour it follows how he breaks out of India's 'rooster coop' of servitude, and the crime that makes him an entrepreneur.",
  "author": "Aravind Adiga",
  "year": 2008,
  "pages": 276,
  "status": "read",
  "rating": 0,
  "cover": "https://covers.openlibrary.org/b/id/2787359-L.jpg",
  "spine": { text: true, bg: '#f7f3ee', ink: '#111111', font: "900 {s}px Impact, 'Arial Black', sans-serif", accent: '#9c1a5c' },
  "note": ""
 },
 {
  "id": "836746",
  "title": "A Grain of Wheat",
  "about": "In the days before Kenya's independence in 1963, the village of Thabai prepares to honour its heroes of the Mau Mau uprising and hunt down the man who betrayed their leader Kihika. As the villagers' memories unfold, secrets of loyalty, betrayal and guilt surface in the quiet, respected Mugo.",
  "author": "Ngũgĩ wa Thiong'o",
  "year": 1967,
  "pages": 247,
  "status": "to-read",
  "rating": 0,
  "cover": "https://images.penguinrandomhouse.com/cover/9780143106760",
  "spine": { crop: [0.25, 0.885, 0.5, 0.055] },
  "note": ""
 },
 {
  "id": "111085",
  "title": "No Longer at Ease",
  "about": "Obi Okonkwo, grandson of the hero of Things Fall Apart, comes home from a British university to a civil-service post in Lagos, determined to stay honest. Caught between his ideals, his family's expectations, a forbidden love and mounting debts, he slips towards the bribery he set out to resist.",
  "author": "Chinua Achebe",
  "year": 1961,
  "pages": 196,
  "status": "to-read",
  "rating": 0,
  "cover": "https://images.penguinrandomhouse.com/cover/9780385474559",
  "spine": { crop: [0.05, 0.255, 0.9, 0.09] },
  "note": ""
 },
 {
  "id": "413177",
  "title": "Beasts of No Nation",
  "about": "Agu is a young boy in an unnamed West African country when war reaches his village and he is forced to join a band of rebel soldiers. Told in his own fractured voice, the novel follows the horrors he is made to commit and his struggle to keep some part of the child he was.",
  "author": "Uzodinma Iweala",
  "year": 2005,
  "pages": 142,
  "status": "to-read",
  "rating": 0,
  "cover": "https://covers.openlibrary.org/b/id/7390955-L.jpg",
  "spine": { crop: [0.04, 0.172, 0.93, 0.062] },
  "note": ""
 }
];

// in list order (1 = top of the list)
export const FILMS = [
 {
  "title": "Material",
  "year": 2012,
  "director": "Craig Freimond",
  "slug": "material",
  "poster": "https://image.tmdb.org/t/p/w500/v0xXvDl76Yn5tJGz6BCMLIH2l5O.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/mmNOtiNgcs2jj0DqrNS3QK9KO3E.png",
  "backdrop": null,
  "synopsis": "Cassim Kaif is a young Muslim man who works in his father's fabric shop in Fordsburg, Johannesburg. In the family tradition, Cassim, as the only son, is expected to take over the family business from his father.",
  "note": ""
 },
 {
  "title": "Lion",
  "year": 2016,
  "director": "Garth Davis",
  "slug": "lion",
  "poster": "https://image.tmdb.org/t/p/w500/kCELJH1tCmaRLqvwIgKDb09aEaw.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/6NtRS3Y0KoErUHMKd8pk657fZwC.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/jx/co/k3/vp/lion-1200-1200-675-675-crop-000000.jpg?v=b4cbf1530c",
  "synopsis": "A five-year-old Indian boy gets lost on the streets of Calcutta, thousands of kilometers from home. He survives many challenges before being adopted by a couple in Australia; 25 years later, he sets out to find his lost family.",
  "note": ""
 },
 {
  "title": "Joe",
  "year": 2013,
  "director": "David Gordon Green",
  "slug": "joe-2013",
  "poster": "https://image.tmdb.org/t/p/w500/numu669Pf8wOPcqImONWORYx0Pp.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/WHXVA48JBwakp3cdwdUkNmowYR.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/pa/d4/ds/cs/joe-1200-1200-675-675-crop-000000.jpg?v=95722c853a",
  "synopsis": "The rough-hewn boss of a lumber crew courts trouble when he steps in to protect the youngest member of his team from an abusive father.",
  "note": ""
 },
 {
  "title": "City of God",
  "year": 2002,
  "director": "Fernando Meirelles",
  "slug": "city-of-god",
  "poster": "https://image.tmdb.org/t/p/w500/k7eYdWvhYQyRQoU2TB2A2Xu2TfD.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/jTgUNDqwWIpzqqLliFENRRKLHRp.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/pn/lo/pe/jr/city-of-god-1200-1200-675-675-crop-000000.jpg?v=b03d621f8a",
  "synopsis": "In the poverty-stricken favelas of Rio de Janeiro in the 1970s, two young men choose different paths. Rocket is a budding photographer who documents the increasing drug-related violence of his neighborhood, while José “Zé” Pequeno is an ambitious drug dealer diving into a dangerous life of crime.",
  "note": ""
 },
 {
  "title": "Beasts of No Nation",
  "year": 2015,
  "director": "Cary Joji Fukunaga",
  "slug": "beasts-of-no-nation",
  "poster": "https://image.tmdb.org/t/p/w500/1D4vcJmJc58WXarpRtwgd2do9Rg.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/8Edm0assnCckcdCFrUdufR9daaI.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/lv/u3/b4/05/beasts-of-no-nation-1200-1200-675-675-crop-000000.jpg?v=f86e88a83f",
  "synopsis": "Based on the experiences of Agu, a child fighting in the civil war of a West African country. Follows Agu's journey as he's forced to join a group of soldiers. While he fears his commander and many of the men around him, his fledgling childhood has been brutally shattered by the war raging through his country, and he is at first torn between conflicting revulsion and fascination.",
  "note": ""
 },
 {
  "title": "The Devil All the Time",
  "year": 2020,
  "director": "Antonio Campos",
  "slug": "the-devil-all-the-time",
  "poster": "https://image.tmdb.org/t/p/w500/bVL7LGq528h3KzeNI90HOVbV5uW.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/mcaS1ik3Pqr4R2e5qqaZnNPXJGP.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/mx/9g/et/b7/devil-all-the-time-1200-1200-675-675-crop-000000.jpg?v=e2180a530e",
  "synopsis": "In Knockemstiff, Ohio and its neighboring backwoods, sinister characters converge around young Arvin Russell as he fights the evil forces that threaten him and his family.",
  "note": ""
 },
 {
  "title": "Moonlight",
  "year": 2016,
  "director": "Barry Jenkins",
  "slug": "moonlight-2016",
  "poster": "https://image.tmdb.org/t/p/w500/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/6wN6IzgE6SuM8snMvplLw5AKmKy.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/6x/tq/pl/q7/moonlight-2016-1200-1200-675-675-crop-000000.jpg?v=957301ae3d",
  "synopsis": "The tender, heartbreaking story of a young man’s struggle to find himself, told across three defining chapters in his life as he experiences the ecstasy, pain, and beauty of falling in love, while grappling with his own sexuality.",
  "note": ""
 },
 {
  "title": "Forrest Gump",
  "year": 1994,
  "director": "Robert Zemeckis",
  "slug": "forrest-gump",
  "poster": "https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/as10mpHSWebQVXwMbwQfWYfR27F.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/ly/1s/z6/yx/forrest-gump-1200-1200-675-675-crop-000000.jpg?v=9586afc240",
  "synopsis": "A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do. But despite all he has achieved, his one true love eludes him.",
  "note": ""
 },
 {
  "title": "Four Corners",
  "year": 2014,
  "director": "Ian Gabriel",
  "slug": "four-corners-2014",
  "poster": "https://image.tmdb.org/t/p/w500/9366HqFCKk8WCOFty3gUU9xP499.jpg",
  "logo": null,
  "backdrop": null,
  "synopsis": "Directed by Ian Gabriel, “Four Corners” revolves around a 13-year-old chess whiz drawn into the Cape Town’s well-known child-gang culture. Touted as the first film to delve into the 100-year-old war between South Africa’s so-called Number gangs, the 26 and the 28, it blends the Sabela, Tsotsi-taal and Cape Afrikaans dialects and mixes established talents with non-actors and first-time thesps from schools and communities across the Cape Flats.",
  "note": ""
 },
 {
  "title": "Kung Fu Hustle",
  "year": 2004,
  "director": "Stephen Chow",
  "slug": "kung-fu-hustle",
  "poster": "https://image.tmdb.org/t/p/w500/exbyTbrvRUDKN2mcNEuVor4VFQW.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/gDHnILahBYIawdohMVkvRqXmBQX.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/b8/9s/qh/24/kung-fu-hustle-1200-1200-675-675-crop-000000.jpg?v=3034a73f10",
  "synopsis": "It's the 1940s, and the notorious Axe Gang terrorizes Shanghai. Small-time criminals Sing and Bone hope to join, but they only manage to make lots of very dangerous enemies. Fortunately for them, kung fu masters and hidden strength can be found in unlikely places. Now they just have to take on the entire Axe Gang.",
  "note": ""
 },
 {
  "title": "Boyz n the Hood",
  "year": 1991,
  "director": "John Singleton",
  "slug": "boyz-n-the-hood",
  "poster": "https://image.tmdb.org/t/p/w500/kaS8BkTZESnkoB5i1zRQ02FIRGk.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/6Advq2hn9AdzGkl3Yo5zaV8Ij0g.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/2m/rw/z2/ea/boyz-n-hood-1200-1200-675-675-crop-000000.jpg?v=95ba4b561b",
  "synopsis": "In the middle of the Los Angeles ghetto, drugs, robberies and shootings dominate everyday life. During these times, Furious tries to raise his son Tre to be a decent person. Tre's friends, on the other hand, have little regard for the law and drag the entire neighborhood into a street war...",
  "note": ""
 },
 {
  "title": "Roepman",
  "year": 2011,
  "director": "Paul Eilers",
  "slug": "stargazer",
  "poster": "https://image.tmdb.org/t/p/w500/bpPR52fyTOBW7EOC7lWgzODu0sX.jpg",
  "logo": null,
  "backdrop": null,
  "synopsis": "Tells the story of a 1966 railway community, told through the eyes of an eleven year old boy, called Timus.",
  "note": ""
 },
 {
  "title": "District 9",
  "year": 2009,
  "director": "Neill Blomkamp",
  "slug": "district-9",
  "poster": "https://image.tmdb.org/t/p/w500/tuGlQkqLxnodDSk6mp5c2wvxUEd.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/gneH6YMq0WKVBLBXO8rzf1YBerp.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/mf/c4/1q/9r/district-9-1200-1200-675-675-crop-000000.jpg?v=f4b65885a6",
  "synopsis": "Thirty years ago, aliens arrive on Earth. Not to conquer or give aid, but to find refuge from their dying planet. Separated from humans in a South African area called District 9, the aliens are managed by Multi-National United, which is unconcerned with the aliens' welfare but will do anything to master their advanced technology. When a company field agent contracts a mysterious virus that begins to alter his DNA, there is only one place he can hide: District 9.",
  "note": ""
 },
 {
  "title": "Treasure Planet",
  "year": 2002,
  "director": "Ron Clements & John Musker",
  "slug": "treasure-planet",
  "poster": "https://image.tmdb.org/t/p/w500/kNhZkR3UNbXfvESQo7mJpOi4tGd.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/gq5U32W6ohl1j3hhwzDzOwIMz6K.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/mr/t5/uh/fw/treasure-planet-1200-1200-675-675-crop-000000.jpg?v=95eed4fc64",
  "synopsis": "When space galleon cabin boy Jim Hawkins discovers a map to an intergalactic \"loot of a thousand worlds,\" a cyborg cook named John Silver teaches him to battle supernovas and space storms on their journey to find treasure.",
  "note": ""
 },
 {
  "title": "The Iron Giant",
  "year": 1999,
  "director": "Brad Bird",
  "slug": "the-iron-giant",
  "poster": "https://image.tmdb.org/t/p/w500/k1Cv5CHJvqGWK1xJDUJz8DojFEy.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/aRDVgsUm92eSqq0ANujZFo7hkvr.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/xq/b9/aq/52/the-iron-giant-1200-1200-675-675-crop-000000.jpg?v=1263519a7f",
  "synopsis": "In the small town of Rockwell, Maine in October 1957, a giant metal machine befriends a nine-year-old boy and ultimately finds its humanity by unselfishly saving people from their own fears and prejudices.",
  "note": ""
 },
 {
  "title": "Brother Bear",
  "year": 2003,
  "director": "Aaron Blaise & Robert Walker",
  "slug": "brother-bear",
  "poster": "https://image.tmdb.org/t/p/w500/otptPbEY0vBostmo95xwiiumMJm.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/mhVGwD2fRgtmPF5cnxODVZUw2Zi.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/mt/l0/lg/io/brother-bear-1200-1200-675-675-crop-000000.jpg?v=2d201d5e87",
  "synopsis": "When an impulsive boy named Kenai is magically transformed into a bear, he must literally walk in another's footsteps until he learns some valuable life lessons. His courageous and often zany journey introduces him to a forest full of wildlife, including the lovable bear cub Koda, hilarious moose Rutt and Tuke, woolly mammoths and rambunctious rams.",
  "note": ""
 },
 {
  "title": "3 Idiots",
  "year": 2009,
  "director": "Rajkumar Hirani",
  "slug": "3-idiots",
  "poster": "https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/v6Hihdrx8TajNEbWSDD8cxi5er1.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/5l/yf/td/02/3%20idiots-1200-1200-675-675-crop-000000.jpg?v=95a0413b96",
  "synopsis": "Rascal. Joker. Dreamer. Genius... You've never met a college student quite like \"Rancho.\" From the moment he arrives at India's most prestigious university, Rancho's outlandish schemes turn the campus upside down—along with the lives of his two newfound best friends. Together, they make life miserable for \"Virus,\" the school’s uptight and heartless dean. But when Rancho catches the eye of the dean's daughter, Virus sets his sights on flunking out the \"3 idiots\" once and for all.",
  "note": ""
 },
 {
  "title": "12th Fail",
  "year": 2023,
  "director": "Vidhu Vinod Chopra",
  "slug": "12th-fail",
  "poster": "https://image.tmdb.org/t/p/w500/eebUPRI4Z5e1Z7Hev4JZAwMIFkX.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/nhnKWMtAdD31Wklbq4JR4IDWbHa.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/yx/vn/zx/h4/12th%20fail-1200-1200-675-675-crop-000000.jpg?v=7a365fb114",
  "synopsis": "Based on the true story of IPS officer Manoj Kumar Sharma, 12th Fail sheds limelight on fearlessly embracing the idea of restarting the academic journey despite the setbacks and challenges and reclaiming one's destiny at a place where millions of students attempt the world's toughest competitive exam: UPSC.",
  "note": ""
 },
 {
  "title": "Slumdog Millionaire",
  "year": 2008,
  "director": "Danny Boyle",
  "slug": "slumdog-millionaire",
  "poster": "https://image.tmdb.org/t/p/w500/5leCCi7ZF0CawAfM5Qo2ECKPprc.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/bTL1Vkgt5Ux5aJp7ij6FER1FQXH.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/hs/8w/zu/6c/slumdog-millionaire-1200-1200-675-675-crop-000000.jpg?v=95cd062a0c",
  "synopsis": "A teenager reflects on his life after being accused of cheating on the Indian version of \"Who Wants to be a Millionaire?\".",
  "note": ""
 },
 {
  "title": "Spud",
  "year": 2010,
  "director": "Donovan Marsh",
  "slug": "spud",
  "poster": "https://image.tmdb.org/t/p/w500/eZptpTY1VMMcyGdj3Hp5SY3M1IN.jpg",
  "logo": null,
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/ft/tc/at/7m/7HvbATFNRLM63QMiCqb51RogIjH-1200-1200-675-675-crop-000000.jpg?v=a52754cb76",
  "synopsis": "It's South Africa 1990. Two major events are about to happen: The release of Nelson Mandela and, more importantly, it's Spud Milton's first year at an elite boys only private boarding school. Spud is a boy from an ordinary background who wins a scholarship to a private school in Kwazulu-Natal, South Africa. Surrounded by boys with nicknames like Gecko, Rambo, Rain Man and Mad Dog, Spud has his hands full trying to adapt to his new home.",
  "note": ""
 },
 {
  "title": "Spider-Man",
  "year": 2002,
  "director": "Sam Raimi",
  "slug": "spider-man",
  "poster": "https://image.tmdb.org/t/p/w500/or6XJBVpcEbIkma0V9zshnbEtx4.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/kNPXwReF35JpWBqGw8HadykznPT.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/s3/jh/92/at/spider-man-1200-1200-675-675-crop-000000.jpg?v=cdd43f1a66",
  "synopsis": "After being bitten by a genetically altered spider at Oscorp, nerdy but endearing high school student Peter Parker is endowed with amazing powers to become the superhero known as Spider-Man.",
  "note": ""
 },
 {
  "title": "31 Million Reasons",
  "year": 2011,
  "director": "Johnny Barker",
  "slug": "31-million-reasons",
  "poster": "https://image.tmdb.org/t/p/w500/9c6s8gdPMJY0pGJIjT51rH5VXkr.jpg",
  "logo": null,
  "backdrop": null,
  "synopsis": "Cops, Robbers and Bunny Chow - Loosely based on a true story about one of the biggest robberies in South African history. Brothers Ronnie (Jack Devnarain) and Jugs (Rahul Brijnath), two police man from Chatsworth, hatch a plot to seize 31 million rand from a cash deposit facility. Its high stakes when the cops are assigned to investigate their own heist.",
  "note": ""
 },
 {
  "title": "Parasite",
  "year": 2019,
  "director": "Bong Joon Ho",
  "slug": "parasite-2019",
  "poster": "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/eEGZWCv0OYbMLCaNsDl1cgrvnWR.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/oi/ha/78/z8/parasite-1200-1200-675-675-crop-000000.jpg?v=03b9da4410",
  "synopsis": "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
  "note": ""
 },
 {
  "title": "Her",
  "year": 2013,
  "director": "Spike Jonze",
  "slug": "her",
  "poster": "https://image.tmdb.org/t/p/w500/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/euFg9ZE59r6tWTq2vtjENupUdk7.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/cb/fz/at/20/her-1200-1200-675-675-crop-000000.jpg?v=95add3bc83",
  "synopsis": "In the not so distant future, Theodore, a lonely writer, purchases a newly developed operating system designed to meet the user's every need. To Theodore's surprise, a romantic relationship develops between him and his operating system. This unconventional love story blends science fiction and romance in a sweet tale that explores the nature of love and the ways that technology isolates and connects us all.",
  "note": ""
 },
 {
  "title": "Logan",
  "year": 2017,
  "director": "James Mangold",
  "slug": "logan-2017",
  "poster": "https://image.tmdb.org/t/p/w500/fnbjcRDYn6YviCcePDnGdyAkYsB.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/qDbxobWA4J2xVqwuDl71vg8JZxX.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/3g/vl/z4/dt/logan-2017-1200-1200-675-675-crop-000000.jpg?v=33cba47db1",
  "synopsis": "In the near future, a weary Logan cares for an ailing Professor X in a hideout on the Mexican border. But Logan's attempts to hide from the world and his legacy are upended when a young mutant arrives, pursued by dark forces.",
  "note": ""
 },
 {
  "title": "The Dark Knight Rises",
  "year": 2012,
  "director": "Christopher Nolan",
  "slug": "the-dark-knight-rises",
  "poster": "https://image.tmdb.org/t/p/w500/hr0L2aueqlP2BYUblTTjmtn0hw4.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/A0QGz3heDFbLT3YCXa2jUKfWnbx.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/am/k2/f0/ij/dark-knight-rises-1200-1200-675-675-crop-000000.jpg?v=8b93dcd6f0",
  "synopsis": "Following the death of District Attorney Harvey Dent, Batman assumes responsibility for Dent's crimes to protect the late attorney's reputation and is subsequently hunted by the Gotham City Police Department. Eight years later, Batman encounters the mysterious Selina Kyle and the villainous Bane, a new terrorist leader who overwhelms Gotham's finest. The Dark Knight resurfaces to protect a city that has branded him an enemy.",
  "note": ""
 },
 {
  "title": "Hereditary",
  "year": 2018,
  "director": "Ari Aster",
  "slug": "hereditary",
  "poster": "https://image.tmdb.org/t/p/w500/4GFPuL14eXi66V96xBWY73Y9PfR.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/xhSvs5ZY2HSNb0v4zrKGwTyUfkv.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/n8/1b/aq/qx/hereditary-1200-1200-675-675-crop-000000.jpg?v=dab0d1c6ef",
  "synopsis": "Following the death of the Leigh family matriarch, Annie and her children uncover disturbing secrets about their heritage. Their daily lives are not only impacted, but they also become entangled in a chilling fate from which they cannot escape, driving them to the brink of madness.",
  "note": ""
 },
 {
  "title": "Toy Story 3",
  "year": 2010,
  "director": "Lee Unkrich",
  "slug": "toy-story-3",
  "poster": "https://image.tmdb.org/t/p/w500/AbbXspMOwdvwWZgVN0nabZq03Ec.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/1rBoAA0H6gE978rIgdgaLCJ265l.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/ou/bu/8l/cf/toy-story-3-40-1200-1200-675-675-crop-000000.jpg?v=fb3bc382b9",
  "synopsis": "Woody, Buzz, and the rest of Andy's toys haven't been played with in years. With Andy about to go to college, the gang find themselves accidentally left at a nefarious day care center. The toys must band together to escape and return home to Andy.",
  "note": ""
 },
 {
  "title": "BlacKkKlansman",
  "year": 2018,
  "director": "Spike Lee",
  "slug": "blackkklansman",
  "poster": "https://image.tmdb.org/t/p/w500/8jxqAvSDoneSKRczaK8v9X5gqBp.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/2NiDymhENZNNOm3DjJpqHVqj25s.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/t4/wa/t7/20/black-klansman-1200-1200-675-675-crop-000000.jpg?v=089209a531",
  "synopsis": "Colorado Springs, late 1970s. Ron Stallworth, an African American police officer, and Flip Zimmerman, his Jewish colleague, run an undercover operation to infiltrate the Ku Klux Klan.",
  "note": ""
 },
 {
  "title": "Captain Phillips",
  "year": 2013,
  "director": "Paul Greengrass",
  "slug": "captain-phillips",
  "poster": "https://image.tmdb.org/t/p/w500/8Td0kkocW6sD3uRpzwfMfkqMWhx.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/zFq8MPe68ljeTVhowyGgregpZ8E.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/7q/sp/pq/en/captain-phillips-1200-1200-675-675-crop-000000.jpg?v=95e0781a1f",
  "synopsis": "The true story of Captain Richard Phillips and the 2009 hijacking by Somali pirates of the US-flagged MV Maersk Alabama, the first American cargo ship to be hijacked in two hundred years.",
  "note": ""
 },
 {
  "title": "Kingdom of the Planet of the Apes",
  "year": 2024,
  "director": "Wes Ball",
  "slug": "kingdom-of-the-planet-of-the-apes",
  "poster": "https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/odfQQNwtLKPlTPahXUPreSUT0YV.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/62/f0/gf/so/fypydCipcWDKDTTCoPucBsdGYXW-1200-1200-675-675-crop-000000.jpg?v=af972bf69e",
  "synopsis": "Several generations following Caesar's reign, apes – now the dominant species – live harmoniously while humans have been reduced to living in the shadows. As a new tyrannical ape leader builds his empire, one young ape undertakes a harrowing journey that will cause him to question all he's known about the past and to make choices that will define a future for apes and humans alike.",
  "note": ""
 },
 {
  "title": "Rocky",
  "year": 1976,
  "director": "John G. Avildsen",
  "slug": "rocky",
  "poster": "https://image.tmdb.org/t/p/w500/raayaQ9WTUGolsYHPWc2bGonu58.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/4ZMlbEpP1gY7QkW5UdeoVwk814x.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/rz/7d/gf/se/14YmXr5ojtOFcABW3CPP5gKjgNU-0-2000-0-2000-1200-1200-675-675-crop-000000.jpg?v=fa45557073",
  "synopsis": "Rocky Balboa is a Philadelphia club fighter who seems to be going nowhere. But when a stroke of fate puts him in the ring with a world heavyweight champion, Rocky knows that it's his one shot at the big time — a once-in-a-lifetime opportunity to go the distance and come out a winner!",
  "note": ""
 },
 {
  "title": "Cinema Paradiso",
  "year": 1988,
  "director": "Giuseppe Tornatore",
  "slug": "cinema-paradiso",
  "poster": "https://image.tmdb.org/t/p/w500/9JhfVOveaY00o8njQu2Xrp4YWud.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/ai7T0EYyCL2guG3o62jwuECvEjK.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/1i/b1/z6/5u/cinema-paradiso-1200-1200-675-675-crop-000000.jpg?v=8efaca6418",
  "synopsis": "A filmmaker recalls his childhood, when he fell in love with the movies at his village's theater and formed a deep friendship with the theater's projectionist.",
  "note": ""
 },
 {
  "title": "Hot Fuzz",
  "year": 2007,
  "director": "Edgar Wright",
  "slug": "hot-fuzz",
  "poster": "https://image.tmdb.org/t/p/w500/zPib4ukTSdXvHP9pxGkFCe34f3y.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/m5Lxfq0buYJg53xR1neJ9yuvArF.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/dw/lj/47/ub/hot-fuzz-30-1200-1200-675-675-crop-000000.jpg?v=0b434ee95d",
  "synopsis": "Former London constable Nicholas Angel finds it difficult to adapt to his new assignment in the sleepy British village of Sandford. Not only does he miss the excitement of the big city, but he also has a well-meaning oaf for a partner. However, when a series of grisly accidents rocks Sandford, Angel smells something rotten in the idyllic village.",
  "note": ""
 },
 {
  "title": "Matilda",
  "year": 1996,
  "director": "Danny DeVito",
  "slug": "matilda",
  "poster": "https://image.tmdb.org/t/p/w500/wYoDpWInsBEVSmWStnRH06ddoyk.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/atxpewyEfwhN6Tr5sQ4z9sBLEgy.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/o6/eu/lh/89/matilda-1200-1200-675-675-crop-000000.jpg?v=e70d4fd758",
  "synopsis": "Matilda Wormwood is an brilliant and intelligent little girl. Unfortunately, her parents, Harry and Zinnia, fail to see that fact. As time passes, she finally starts school and has a kind teacher, loyal friends, and a terrifying, sadistic headmistress. As she becomes fed up with the constant cruelty, she discovers she has a special gift that she just might be able to use to outwit the unruly adults around her.",
  "note": ""
 },
 {
  "title": "The Boy Who Harnessed the Wind",
  "year": 2019,
  "director": "Chiwetel Ejiofor",
  "slug": "the-boy-who-harnessed-the-wind",
  "poster": "https://image.tmdb.org/t/p/w500/yOr7RxHw15MMXNxGMXSmngDqHyI.jpg",
  "logo": "https://image.tmdb.org/t/p/w500/tx7mBYNlB7xhX53sH26e29GgE3L.png",
  "backdrop": "https://a.ltrbxd.com/resized/sm/upload/nk/y4/dw/ar/boy-who-harnessed-the-wind-1200-1200-675-675-crop-000000.jpg?v=2bd591baaf",
  "synopsis": "Against all the odds, a thirteen year old boy in Malawi invents an unconventional way to save his family and village from famine.",
  "note": ""
 }
];

// Cam's PS4 games (the cases are from the model: models/room/ps4-games.glb), in shelf order
export const GAMES = [
    { key: 'detroit', trophies: { totals: { p: 1, g: 3, s: 5, b: 40 }, missing: ["I'LL BE BACK"], missingGrades: { s: 1 }, note: 'One trophy from the platinum: I’ll Be Back, Connor dying and coming back at every chance he gets.' }, pegi: 18, spine: { bg: '#0d1520', ink: '#e8eef6', lines: [{ text: 'DETROIT', weight: 300, spacing: 10 }, { text: 'BECOME HUMAN', weight: 400, k: 0.3, spacing: 6, color: '#7fb4e6' }] }, title: 'Detroit: Become Human', year: 2018, studio: 'Quantic Dream', cover: 'images/room/games/detroit.webp', link: 'https://en.wikipedia.org/wiki/Detroit:_Become_Human',
      trophy: 'One trophy from the platinum', platinum: false, line: 'One trophy off the platinum.',
      about: 'Detroit, 2038. Three androids, Kara, Connor and Markus, start to break from their programming, and every choice you make branches the story of what they become.' },
    { key: 'gow', trophies: { totals: { p: 1, g: 5, s: 9, b: 22 }, missing: ['Chooser of the Slain'], missingGrades: { g: 1 }, note: 'One trophy from the platinum: Sigrún, the Valkyrie Queen, is still standing.' }, pegi: 18, spine: { logo: 'images/room/ps4/logos/gow.png', logoK: 0.85, bg: '#101012', ink: '#e9e2d6', lines: [{ text: 'GOD', family: 'Georgia, "Times New Roman", serif', weight: 700 }, { text: 'OF', family: 'Georgia, serif', weight: 700, k: 0.36, color: '#c4202a' }, { text: 'WAR', family: 'Georgia, serif', weight: 700 }] }, title: 'God of War', year: 2018, studio: 'Santa Monica Studio', cover: 'images/room/games/gow.webp', link: 'https://en.wikipedia.org/wiki/God_of_War_(2018_video_game)',
      trophy: 'One trophy from the platinum', platinum: false, line: 'One trophy off the platinum. Sigrún, the Valkyrie Queen, is still standing in the way.',
      about: 'Kratos, living quietly in the realm of the Norse gods, sets out with his son Atreus to scatter his wife’s ashes from the highest peak in the nine realms.' },
    { key: 'hzd', trophies: { totals: { p: 1, g: 2, s: 5, b: 48 }, note: 'Platinum, earned on Cam’s other account.' }, pegi: 16, spine: { logo: 'images/room/ps4/logos/hzd.png', logoK: 1, bg: '#e9e4da', ink: '#1d2a33', lines: [{ text: 'HORIZON', weight: 300, spacing: 6 }, { text: 'ZERO DAWN', weight: 500, k: 0.34, spacing: 5, color: '#c4532a' }] }, title: 'Horizon Zero Dawn', year: 2017, studio: 'Guerrilla Games', cover: 'images/room/games/hzd.webp', link: 'https://en.wikipedia.org/wiki/Horizon_Zero_Dawn',
      trophy: 'Platinum (on Cam’s other account)', platinum: true, line: 'Platinum. On Cam’s other account, but it counts.',
      about: 'Aloy, raised an outcast, hunts for the truth about where she came from in a far-future world where giant machines roam what’s left of ours.' },
    { key: 'spiderman', trophies: { totals: { p: 1, g: 2, s: 10, b: 38 }, note: 'Platinum, earned on Cam’s other account.' }, pegi: 16, spine: { logo: 'images/room/ps4/logos/spiderman.png', logoK: 0.8, bg: '#c3171f', ink: '#ffffff', squash: 0.82, lines: [{ text: 'MARVEL', weight: 900, k: 0.34, color: '#ffffff' }, { text: 'SPIDER-MAN', weight: 900 }] }, title: 'Marvel’s Spider-Man', year: 2018, studio: 'Insomniac Games', cover: 'images/room/games/spiderman.webp', link: 'https://en.wikipedia.org/wiki/Spider-Man_(2018_video_game)',
      trophy: 'Platinum (on Cam’s other account)', platinum: true, line: 'Platinum. On Cam’s other account, but it counts.',
      about: 'Eight years into being Spider-Man, Peter Parker is juggling rent, a job in Dr Octavius’s lab and a city under attack from Mister Negative’s Inner Demons, while a far bigger threat gathers.' },
    { key: 'fallenorder', trophies: { totals: { p: 1, g: 3, s: 11, b: 25 } }, pegi: 16, spine: { logo: 'images/room/ps4/logos/fallenorder.png', logoK: 0.62, bg: '#0c0f14', ink: '#f2f2f2', lines: [{ text: 'STAR WARS', weight: 800, k: 0.3, spacing: 3, color: '#ffe81f' }, { text: 'JEDI', weight: 800, spacing: 6 }, { text: 'FALLEN ORDER', weight: 600, k: 0.34, spacing: 4 }] }, title: 'Star Wars Jedi: Fallen Order', year: 2019, studio: 'Respawn Entertainment', cover: 'images/room/games/fallenorder.webp', link: 'https://en.wikipedia.org/wiki/Star_Wars_Jedi:_Fallen_Order',
      trophy: 'Platinum', platinum: true, line: 'Platinum.',
      about: 'Five years after Order 66, Padawan Cal Kestis is hiding as a scrapper until the Empire’s Inquisitors find him, and he goes on the run to rebuild the Jedi Order.' },
    { key: 'nfs', trophies: { totals: { p: 1, g: 3, s: 19, b: 8 } }, pegi: 16, spine: { logo: 'images/room/ps4/logos/nfs.png', bg: '#0b0d12', ink: '#ffffff', lines: [{ text: 'NEED FOR SPEED', family: 'Lato, Geist, sans-serif', style: 'italic', weight: 900, color: '#ffffff' }] }, title: 'Need for Speed', year: 2015, studio: 'Ghost Games', cover: 'images/room/games/nfs.webp', link: 'https://en.wikipedia.org/wiki/Need_for_Speed_(2015_video_game)',
      trophy: 'Platinum', platinum: true, line: 'Platinum.',
      about: 'Ventura Bay, always at night: build and tune your car, and earn your name with a crew of street racers.' },
    { key: 'mw', trophies: { totals: { p: 1, g: 5, s: 15, b: 6 } }, pegi: 18, spine: { logo: 'images/room/ps4/logos/mw.png', logoK: 0.86, bg: '#121314', ink: '#f2f2f2', squash: 0.8, lines: [{ text: 'CALL OF DUTY', weight: 900, k: 0.34 }, { text: 'MODERN WARFARE', weight: 900 }] }, title: 'Call of Duty: Modern Warfare', year: 2019, studio: 'Infinity Ward', cover: 'images/room/games/mw.webp', link: 'https://en.wikipedia.org/wiki/Call_of_Duty:_Modern_Warfare_(2019_video_game)',
      trophy: 'Platinum', platinum: true, line: 'Platinum.',
      about: 'Captain Price and a team of special forces chase a stolen chemical weapon from the streets of London to the fictional Urzikstan.' },
];

export const LINKS = {
    goodreads: (b) => `https://www.goodreads.com/book/show/${b.id}`,
    letterboxd: (f) => `https://letterboxd.com/film/${f.slug}/`,
    small: (url) => url.replace('/t/p/w500/', '/t/p/w342/').replace('-L.jpg', '-M.jpg'),   // for textures
    filmList: 'https://letterboxd.com/camwtf/list/personal-all-time-favourites/',
};

// Cam's textbooks, on the bottom shelf: spines out, each with its real cover (images/room/textbooks/,
// from Open Library). Click one to pull it out, like the books above. `about`: Cam's summary (to come).
export const TEXTBOOKS = [
  { title: 'Java Programming', author: 'Joyce Farrell', edition: '9th edition', cover: 'images/room/textbooks/java.webp', bg: '#f1f1ee', ink: '#1d1d1f', accent: '#9bbf3a', t: 0.042, about: '' },
  { title: 'CompTIA Security+ Study Guide', author: 'Mike Chapple & David Seidl', edition: '8th edition · SY0-601', cover: 'images/room/textbooks/secplus.webp', bg: '#c8202b', ink: '#ffffff', accent: '#1b1b1b', t: 0.036, about: '' },
  { title: 'Starting Out with C++', author: 'Tony Gaddis', edition: '9th edition', cover: 'images/room/textbooks/cpp.webp', bg: '#f4f2ee', ink: '#e8541b', accent: '#c8202b', t: 0.046, about: '' },
  { title: 'Operating Systems', author: '', edition: '', cover: null, bg: '#2e2e33', ink: '#f2efe8', accent: '#3fa7a0', t: 0.044, about: '' },
  { title: 'Architecture of Network Systems', author: 'Dimitrios Serpanos & Tilman Wolf', edition: '', cover: 'images/room/textbooks/network.webp', bg: '#13233a', ink: '#ffffff', accent: '#e8c23a', t: 0.034, about: '' },
];
