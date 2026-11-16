// ============================================================================
// The record wall: Cameron's albums, as sleeves on the wall over the record player.
// Click one to look at it (cover, tracklist), and "play" puts it on the deck.
// Each is a Spotify album: `id` (the album), `cover` (its i.scdn.co image id),
// `bg` (Spotify's colour for it), and the tracks as [track id, title, seconds, artists].
// ============================================================================
const A = (o) => o;
export const RECORDS = [
    A({ key: 'grad', title: 'Graduation', artist: 'Kanye West', year: 2007, id: '4SZko61aMnmgvNhfhgTuD3', cover: 'ab67616d0000b27326f7f19c7f0381e56156c94a', bg: '#912165', tracks: [
        ['6MXXY2eiWkpDCezVCc0cMH', 'Good Morning', 195], ['4UQMOPSUVJVicIQzjAcRRZ', 'Champion', 168], ['0j2T0R9dR9qdJYsB7ciXhf', 'Stronger', 312], ['7rbECVPkY5UODxoOUVKZnA', 'I Wonder', 243],
        ['4ZPdLEztrlZqbJkgHNw54L', 'Good Life', 207, 'T-Pain'], ['0mEdbdeRFQwBhN4xfyIeUM', 'Can’t Tell Me Nothing', 272], ['7387VaiHpOsSIZ5nmjseya', 'Barry Bonds', 204, 'Lil Wayne'],
        ['7DRuzSlhjKadgdsQRYZ0tr', 'Drunk and Hot Girls', 313, 'Mos Def'], ['5TRPicyLGbAF2LGBFbHGvO', 'Flashing Lights', 238, 'Dwele'], ['0NrtwAmRAdLxua31SzHvXr', 'Everything I Am', 228, 'DJ Premier'],
        ['0lWjRSzq5chA9fps3pM8Zr', 'The Glory', 213], ['4iz9lGMjU1lXS51oPmUmTe', 'Homecoming', 203, 'Chris Martin'], ['2L47m9erkB5KBZcaqWtYen', 'Big Brother', 288], ['3bhyo2ED5Yd4RLydQBDtD6', 'Good Night', 186, 'Mos Def, Al Be Back'],
    ] }),
    A({ key: 'gkmc', title: 'good kid, m.A.A.d city', artist: 'Kendrick Lamar', year: 2012, id: '0Oq3mWfexhsjUh0aNNBB5u', cover: 'ab67616d0000b2732cd55246d935a8a77cb4859e', bg: '#535359', tracks: [
        ['3KHjXNQDEZ0Hb2hzGdxcx7', 'Sherane a.k.a Master Splinter’s Daughter', 274], ['0yhMmqax6HRAZxI7udEask', 'Bitch, Don’t Kill My Vibe', 311], ['0vjKXtFLt6Ti08Y3JCnRKB', 'Backseat Freestyle', 213],
        ['4Gf6VlNy2E4VVuAkl0y2XW', 'The Art of Peer Pressure', 325], ['74tLlkN3rgVzRqQJgPfink', 'Money Trees', 387, 'Jay Rock'], ['5J6CXHvsfRGyyCnQZmVPoE', 'Poetic Justice', 300, 'Drake'],
        ['3yapR7DctB2WtbmXkHHviC', 'good kid', 214], ['0nfQguNoAfKFjsQHr6qnxc', 'm.A.A.d city', 350, 'MC Eiht'], ['3VYzbU22BooAROigHHwycs', 'Swimming Pools (Drank)', 314],
        ['69pkT3GewmjhQf6vQWcK2L', 'Sing About Me, I’m Dying Of Thirst', 724], ['2MYm1yy4bYba3mGF9Ou6Yo', 'Real', 443, 'Anna Wise'], ['3i2XxFTLd2061UISvE5W7f', 'Compton', 248, 'Dr. Dre'],
    ] }),
    A({ key: 'peep', title: 'Come Over When You’re Sober, Pt. 1', artist: 'Lil Peep', year: 2017, id: '70LJ28NE9LV93xF2z6PiyN', cover: 'ab67616d0000b273eb998de81063e6f2e2c4c2bd', bg: '#9d0030', tracks: [
        ['0E9kGKtSm8btX8qPUvIsyT', 'Benz Truck (гелик)', 160], ['3VZlCJimDGY0D7YEC7S351', 'Save That Shit', 232], ['77qveRnReN3HaFrikk58nB', 'Awful Things', 214, 'Lil Tracy'],
        ['5pqmqD9kdWnTZUUGvUQnHc', 'U Said', 224], ['1gdNxRTubgFNxi3SgrYwxj', 'Better Off (Dying)', 155], ['7lbGqBMyCOK43hwY0Kcu7o', 'The Brightside', 216], ['3f3EHJg9siYsaTRaSbhGEg', 'Problems', 209],
    ] }),
    A({ key: 'hybrid', title: 'Hybrid Theory', artist: 'Linkin Park', year: 2000, id: '6PFPjumGRpZnBzqnDci6qJ', cover: 'ab67616d0000b2732cd7568f8895a3c031c2e2fb', bg: '#54544d', tracks: [
        ['4HvcbAR8LisalXKt7cpqE1', 'Papercut', 185], ['4bYLTrlcqctyHck3fjhMgW', 'One Step Closer', 157], ['1Q9QN6dHEDeUegsySY012f', 'With You', 203], ['214LJVTqrkUOGemWDGHJpr', 'Points of Authority', 200],
        ['0X576XiCW9uEtko6f6VkcU', 'Crawling', 209], ['5tkHje8FGSF258gi869GcV', 'Runaway', 184], ['4SJoEhpI6C61wtUfxSHMGc', 'By Myself', 190], ['7q115ia4fQn9zonjpexWsY', 'In the End', 217],
        ['1B8WdDScvobpFsZLfdmIE1', 'A Place for My Head', 185], ['3JAu2BH8sSI46rJGzQerb6', 'Forgotten', 194], ['15voDM9pGkwEvHBUecpcmo', 'Cure for the Itch', 157], ['4HlMOXxwF9SYG1RoJxEjio', 'Pushing Me Away', 191],
    ] }),
    A({ key: 'tpab', title: 'To Pimp A Butterfly', artist: 'Kendrick Lamar', year: 2015, id: '7ycBtnsMtyVbbwTfJwRjSP', cover: 'ab67616d0000b273cdb645498cd3d8a2db4d05e1', bg: '#535353', tracks: [
        ['7Ks4VCY1wFebnOdJrM13t6', 'Wesley’s Theory', 287, 'George Clinton, Thundercat'], ['75izAeHlGuOgA865CFDyIv', 'For Free? (Interlude)', 131], ['0N3W5peJUQtI4eyR6GJT5O', 'King Kunta', 235],
        ['4oFtLSgHyZPNYDCcANhTnO', 'Institutionalized', 272, 'Bilal, Anna Wise, Snoop Dogg'], ['7uWVT3UkCAZyANvv0bdyQn', 'These Walls', 301, 'Bilal, Anna Wise, Thundercat'], ['1bxEpNR75Hq3T2oF9AZjt8', 'u', 268],
        ['3iVcZ5G6tvkXZkZKlMpIUs', 'Alright', 219], ['7unx2Rvsq8D0RfOLRXclTA', 'For Sale? (Interlude)', 292], ['0CjJqkWOpIUXdem5hUcxAk', 'Momma', 283], ['2UOYzhusMTypF7oAQwksCj', 'Hood Politics', 293],
        ['4tQcyj5488alHT1ZgFduzn', 'How Much A Dollar Cost', 262, 'James Fauntleroy, Ronald Isley'], ['72hFOhhhnOJZnnp6uVOgPn', 'Complexion (A Zulu Love)', 263, 'Rapsody'],
        ['5Mtt6tZSZA9cXTHGSGpyh0', 'The Blacker The Berry', 329], ['7A3ETuOrieyx9KSF0sn0Zf', 'You Ain’t Gotta Lie (Momma Said)', 242], ['3ODXRUPL44f04cCacwiCLC', 'i', 336], ['1WT11QmhZutciEv1NsHt1R', 'Mortal Man', 727],
    ] }),
    A({ key: 'hers', title: 'Invitation to Her’s', artist: 'Her’s', year: 2018, id: '3w5PWzbOdhuHd2oTynfBJw', cover: 'ab67616d0000b273280a001e43c93792dd1e27c7', bg: '#4a5833', tracks: [
        ['1zFbBrZmJr1Z49HYe84dBg', 'Harvey', 211], ['5GOVjC32dV7jhi23SbeyWs', 'Mannie’s Smile', 220], ['7KO4XNfwEKhTbSGo3O6qX5', 'If You Know What’s Right', 200], ['2l7vMv0FwKb7S1OZMkJRP1', 'Carry the Doubt', 281],
        ['7iDeRCT8iKSQGzgeqjYezp', 'Low Beam', 269], ['3N5XFFh2FJOegILjRLRQTg', 'Breathing Easy', 289], ['6RG8y3WSNUE3DcIC3eQCXO', 'Blue Lips', 222], ['1NjzNt18LlNTuJYErYGvbQ', 'She Needs Him', 314],
        ['1f1WvgLY6m8NeAT16sxBYz', 'Love on the Line (Call Now)', 190], ['3zjvduyGhyBKYCVHGn6E74', 'Don’t Think It Over', 246], ['0UVzM2GkqTTf57G6Wj05UL', 'Under Wraps', 303],
    ] }),
    A({ key: 'damn', title: 'DAMN.', artist: 'Kendrick Lamar', year: 2017, id: '4eLPsYPBmXABThSJ821sqY', cover: 'ab67616d0000b2738b52c6b9bc4e43d873869699', bg: '#9f0000', tracks: [
        ['1n4jwRVXdkK2U34nBDUKKT', 'BLOOD.', 118], ['6HZILIRieu8S0iqY8kIKhj', 'DNA.', 186], ['4BHSjbYylfOH5WAGusDyni', 'YAH.', 160], ['1EaKU4dMbesXXd3BrLCtYG', 'ELEMENT.', 209], ['2LTlO3NuNVN70lp2ZbVswF', 'FEEL.', 215],
        ['6SwRhMLwNqEi6alNPVG00n', 'LOYALTY.', 227, 'Rihanna'], ['6IZvVAP7VPPnsGX6bvgkqg', 'PRIDE.', 275], ['7KXjTSCq5nL1LoYtL7XAwS', 'HUMBLE.', 177], ['06FCvd7rrRcF3DdvWH5Isp', 'LUST.', 308],
        ['6PGoSes0D9eUDeeAafB2As', 'LOVE.', 213, 'Zacari'], ['4iYRa2btalAzPZoSYfROqF', 'XXX.', 254, 'U2'], ['23luOrEVHMfoX0AhfbQuS6', 'FEAR.', 461], ['5p3NP9mQblDsVJLdfNZJ3I', 'GOD.', 249], ['0y9uTzK9cNKSAEHnpeRG8C', 'DUCKWORTH.', 249],
    ] }),
    A({ key: 'riky', title: 'Family Values', artist: 'Riky Rick', year: 2015, id: '4Vka3hwfaOqISTHYyOdkKC', cover: 'ab67616d0000b273ed1564c4ebbc1588ccab89c4', bg: '#005976', tracks: [
        ['4zhfE4uSbtsJ7rJCAA9GCs', 'Intro', 160], ['3MKRwAAdNwV16B9W8kzgmM', 'A Time to Love', 210], ['0wGyfqf0WdjdVos3kR2qdU', 'Wonder Years', 272], ['4Kbp7xMB2wN5K8B3hAL3uk', 'Makaveli', 237],
        ['40k035nx9YwLSpfDhEyKwM', 'Boss Zonke', 240], ['5UUl8iByk4yHXiP0PhkZRg', 'Interlude', 21], ['0tLCXM6KU9NAMJoT8rX3j0', 'Papa Song', 331], ['4JlmaJOc27OXgnvIMwpJP8', 'Love We Had (Interlude)', 88],
        ['00gec53aXVCqYMWbKFJHGg', 'Sondela', 274, 'Zano'], ['1n8totVffTTRyU1N1l0Bmp', 'Come Alive', 270, 'Cassper Nyovest, Okmalumkoolkat'], ['50JIGceYpUCZPokUvOa7JS', 'Thuglife', 309],
        ['7LXvPGayMovxK1p5st1U0b', '94 / It’s Getting Worse', 233], ['5YSP9pGkI5dgrUaabk8460', 'Bambalela', 323, 'Black Motion'], ['3GzSKzf6UrUZUaV9Sythkp', 'Gone, Pt. 3', 510],
        ['0TJAMA9Uxi3DZ81WKlY1AZ', 'Shining', 278], ['7hOjAgsUy0ycnpXCM1ZnRY', 'Till I Die (Outro)', 469], ['43nqAOOjecTtyOVmAI27RX', 'Nafukwa', 248], ['0dhCw7wbQqHWjFI4t6CsWv', 'Amantombazane', 226, 'Okmalumkoolkat'],
    ] }),
    A({ key: 'meteora', title: 'Meteora', artist: 'Linkin Park', year: 2003, id: '4Gfnly5CzMJQqkUFfoHaP3', cover: 'ab67616d0000b2735f1f51d14e8bea89484ecd1b', bg: '#535353', tracks: [
        ['4hbpxoMCp62bd1sdy7XehS', 'Foreword', 13], ['6HZdbb05lEXLvcmee3ZXO2', 'Don’t Stay', 188], ['3agtg0x11wPvLIWkYR39nZ', 'Somewhere I Belong', 214], ['4zP2e2aIzOZGEFTq1MDJmm', 'Lying from You', 175],
        ['3R9NKZ4jmxNjOFihSF5s7f', 'Hit the Floor', 164], ['17bgialGAwoiGj1STY4cnR', 'Easier to Run', 204], ['4Yf5bqU3NK4kNOypcrLYwU', 'Faint', 162], ['2DrMcGNKEY0FZqjMovGaCm', 'Figure.09', 198],
        ['6n8TMVyFKoUmDc4apxceRD', 'Breaking the Habit', 196], ['60IkVf7UfQXmt5CwkpcX8a', 'From the Inside', 176], ['4m1P1BSg9nLxaWbvPhNdhw', 'Nobody’s Listening', 179], ['3sbezh9MMCQrr4KY7zw13j', 'Session', 145], ['2nLtzopw4rPReszdYBJU6h', 'Numb', 188],
    ] }),
    A({ key: 's80', title: 'Section.80', artist: 'Kendrick Lamar', year: 2011, id: '1bkN9nIkkCnXeG4yitVS1J', cover: 'ab67616d0000b273eddb2639b74ac6c202032ebe', bg: '#4e5646', tracks: [
        ['1gXH8hT9dxsBqbRy7h2iC8', 'F*ck Your Ethnicity', 225], ['6cfVDaIdvDtYH91RqC6Wox', 'Hol’ Up', 173], ['2Fw5S2gaOSZzdN5dFoC2dj', 'A.D.H.D', 216], ['3L2YOO6dDiB91M1AbQ0CCR', 'No Make-Up (Her Vice)', 236, 'Colin Munroe'],
        ['22gXA7HlEd0z13zdc3hju7', 'Tammy’s Song (Her Evils)', 162], ['3DBFOXJKitLKUjlyOCX7ow', 'Chapter Six', 161], ['71d1KcqByBe8cl0NhFUKVU', 'Ronald Reagan Era', 217], ['5eOmhymcp3AisKPVAytrs6', 'Poe Mans Dreams (His Vice)', 262, 'GLC'],
        ['63OYaVrz3LIarx3l2DxCKD', 'Chapter Ten', 76], ['7AaET28qSzlkFBcySHh4ES', 'Keisha’s Song (Her Pain)', 227, 'Ashtro Bot'], ['2lD6AoA8qf2t4Dkf2TcmNK', 'Rigamortus', 169],
        ['2QVYTN3Z0IGLVF7YEQN5EJ', 'Kush & Corinthians', 305, 'BJ The Chicago Kid'], ['1FRF0NHXBW4ecdulGkTzJY', 'Blow My High (Members Only)', 216], ['4VaL54I6TlzghRTzOhfr7L', 'Ab-Souls Outro', 350, 'Ab-Soul'], ['4WEuEfFiczWxblHyuucSBL', 'HiiiPower', 280],
    ] }),
    A({ key: 'salad', title: 'Salad Days', artist: 'Mac DeMarco', year: 2014, id: '2r63qjVnXyfTc2eJRSptxS', cover: 'ab67616d0000b2738b221f2ccf777ae0d4b0db50', bg: '#44546c', tracks: [
        ['6942romFscvCKkkrTwkAvD', 'Salad Days', 146], ['6g4DgASUwDFOzfqIRsv2GD', 'Blue Boy', 126], ['052rAib4h4fgE5K3Xfa1RE', 'Brother', 213], ['4hhG4RUw3nZiwQ3Cze2AcB', 'Let Her Go', 183],
        ['3Bs2kIOOEcoK40HhnElYvj', 'Goodbye Weekend', 180], ['4P9dvvOX6QpFvG8gKVPi2X', 'Let My Baby Stay', 248], ['4D5r4nLOwh0ktYXmm40eBD', 'Passing Out Pieces', 167], ['2vDSc9uvBhWbt6Yiyt2D5z', 'Treat Her Better', 229],
        ['1Snko28yJOihcRVXs9dAo9', 'Chamber Of Reflection', 232], ['0t4xu05udSTHhq2wn8XEC2', 'Go Easy', 205], ['7lHdQRDEZZfFUs23TSLw1d', 'Jonny’s Odyssey', 158],
    ] }),
    A({ key: 'momo', title: 'Thato Ya Modimo', artist: 'Kelvin Momo', year: 2025, id: '2kVTT41hC7qiYIOEoENEBY', cover: 'ab67616d0000b273862460ce4370d088da882b67', bg: '#6d4d07', tracks: [
        ['1mNdXonMhTsnQd95Oo5SED', 'Buya', 384, 'Yallunder'], ['6h3IeB7kPpdiogIv8IfIXy', 'Emakhaya', 400, 'Tycoon, Omit ST, Cnethemba Gonelo, Mr Maker'], ['3kXfJNbxEa4I8etI6lsE8k', 'Imvula', 482, 'Sir Trill, Ciniso'],
        ['2SRFbIZWNY8aTaXS9iocYw', 'Take Me To The River', 451, 'Jinger Stone'], ['2fQcfMz1NuoJDxdDRuaj3k', 'Flight Mode', 425, 'Mashudu, Tycoon, Omit ST'], ['0OMHMgH263gIrUcszYYivV', 'Emhlabeni', 519, 'Da Muziqal Chef, Thatohatsi, Tracy'],
        ['3j8OOASPjNGXDAce7G09Kq', 'Ethongweni', 425, 'Kabza De Small, Cnethemba Gonelo'], ['2MSzTLwjCFUcGrxNFvU6pm', 'Mkhuzeni', 527, 'Babalwa M, Da Muziqal Chef'], ['4txSUBxwRQxFZCWhmHj76o', 'Empini', 442, 'Thatohatsi'],
        ['7vmzUiBkTNEiHoGnRIZ09f', 'Modimo', 476, 'Tycoon, Sir Trill, Murumba Pitch'], ['3fD3CRxrTurrH3W4nJEt26', 'Ndonwabile', 381, 'Raspy, Babalwa M'], ['2dwWyWFs3o7PdIPD0tY05i', 'Uvalo', 444, 'Nvcho, Stixx'],
        ['4sf32gcoWeS7cn7SAAHOIL', 'Bubbles', 442, 'Babalwa M, Omit ST'], ['7aqEcMALXXpSxfncHKDfBT', 'Soweto Grooves 3.0', 417], ['1tkpj5yXuJqLsp3Si0x1Z3', 'Ngtjele', 455, 'Murumba Pitch'],
        ['15nHr4nclm0Slmz7jBOkLS', 'Khuluma Nam', 376, 'GL_Ceejay'], ['0ygFeQ5BbZQxAMuzjw3JaW', 'Awake', 596, 'Poizen, Earful Soul'], ['4ScFGWrARelETq8nFSDnMK', 'Bring Me Back To Life', 510, 'Jinger Stone, Omit ST'],
        ['4ME1jM0avRO0iEVrsVcNrV', 'Kgosi Yadi Kgosi', 472, 'Daliwonga, MaWhoo, Jinger Stone'], ['3UKGq0zrMno6Ji1buWSlK7', 'Peak Hour', 411, 'Maremo Violin'], ['6JCcc8c4ngSvVSXDzHSSeR', 'That Thing', 394, 'Marvin, Rio Reeves, Mano'],
        ['7thDysj00hYWwDyFHiQUXu', 'Amagama', 442, 'Mr Maker'], ['5JNYToOzZ1aoROyxWsa02V', 'Thandolwam', 442, 'Nontokozo Mkhize'], ['2qP8J5P79PWqsH1GUMplM5', 'Izintho', 510, 'Mkeyz, Mzizi'],
        ['5zhuOIXO16m2nBdhcoR3ot', 'Clap & Tap', 493], ['0FbcLzZcXlWdKqSbiA2b2S', 'Emotions (Prettyboy Zara)', 519], ['29fKXQcFZqTXnIcE6MAHkS', 'Jaiva', 451, 'Omit ST'],
        ['7BmO3GxuqOVh8JQRrRMFHm', 'Sbeba', 584, 'Bandros, Jumo Da Man'], ['4JJ9uAokCjTnRehxJ8ZVvi', 'Hello', 495, 'Bandros, Brandon Dhludhlu'],
    ] }),
    A({ key: 'morale', title: 'Mr. Morale & The Big Steppers', artist: 'Kendrick Lamar', year: 2022, id: '79ONNoS4M9tfIA1mYLBYVX', cover: 'ab67616d0000b2732e02117d76426a08ac7c174f', bg: '#664f28', tracks: [
        ['5Gt9bxniM1SxN61yRzRhXL', 'United In Grief', 255], ['0fX4oNGBWO3dSGUZcVdVV2', 'N95', 196], ['66mVPWmFvXPFf8pjK5ttOW', 'Worldwide Steppers', 203], ['2g6tReTlM2Akp41g0HaeXN', 'Die Hard', 239, 'Blxst, Amanda Reifer'],
        ['28qA8y1sz0FTuSapsCxNOG', 'Father Time', 222, 'Sampha'], ['15pyFQHCTVp6T7vaWctSgO', 'Rich (Interlude)', 103], ['1QPreu0BNOrUfEb8HTd2qG', 'Rich Spirit', 202], ['67XC51nlZncNpHmZ8rOU9a', 'We Cry Together', 341, 'Taylour Paige'],
        ['1REVvAphiSTJyKQ1fDpHa4', 'Purple Hearts', 329, 'Summer Walker, Ghostface Killah'], ['6BU1RZexmvJcBjgagVVt3M', 'Count Me Out', 284], ['4zMxWSP2qZUy5CBCH5PdzZ', 'Crown', 264], ['3lzUeaCbcCDB5IXYfqWRlF', 'Silent Hill', 221, 'Kodak Black'],
        ['5G4uLkFKdEZLcuNyeomQmE', 'Savior (Interlude)', 153], ['3drdWsJKiVCSQ2gKhd9BDT', 'Savior', 224, 'Baby Keem, Sam Dew'], ['1uY1X8YeBixs1FdQ3fQ7d4', 'Auntie Diaries', 281], ['6CmpZfKUQ2KerzBFZ3QKFr', 'Mr. Morale', 211, 'Tanna Leone'],
        ['346SJSEbB6pNZMpwovxDiu', 'Mother I Sober', 407, 'Beth Gibbons'], ['5xoYormSTltk6F9SlQV6mm', 'Mirror', 256], ['5qbhVL3vB7HwWvb0042B7y', 'The Heart Part 5', 332],
    ] }),
    A({ key: 'peep2', title: 'Come Over When You’re Sober, Pt. 2', artist: 'Lil Peep', year: 2018, id: '52JymrguPgkmmwLaWIusst', cover: 'ab67616d0000b27355e36b0dc5b0ef008fc85319', bg: '#335960', tracks: [
        ['1BCBBO8VUEFOb6RBct4XDp', 'Broken Smile (My All)', 281], ['1FBi1YWCAxlRmfuUbMINqO', 'Runaway', 193], ['0H1Had94fszD13qsFsP1U5', 'Sex with My Ex', 214], ['4kQazx3VMaDKUG1IIaC94i', 'Cry Alone', 167],
        ['6cX1iTffMIAU8lEWSOYIIO', 'Leanin’', 206], ['6akBF8JWM8lrpqejdwIfYI', '16 Lines', 245], ['5rYpwP1dHWGVMrSZbTmt3e', 'Life is Beautiful', 208], ['2FoRvrNWBtrJiSgIjmivKG', 'Hate Me', 181],
        ['6zZhlOWizcEG1T7zsTdI6N', 'IDGAF', 214], ['5qCQyPB2MEICEcSC8WVbNx', 'White Girl', 201], ['3GGkqI7lQTP1D6CtymwnHZ', 'Fingers', 183],
    ] }),
    A({ key: 'gnx', title: 'GNX', artist: 'Kendrick Lamar', year: 2024, id: '0hvT3yIEysuuvkK73vgdcW', cover: 'ab67616d0000b273e2a0a166493a2bde5480a420', bg: '#535353', tracks: [
        ['5gOfC9UzZQzTyShqPMrpjT', 'wacced out murals', 317], ['0nj9Bq5sHDiTxSHunhgkFb', 'squabble up', 158], ['45J4avUb9Ni0bnETYaYFVJ', 'luther', 178, 'SZA'], ['5ho7VSXSmI2KM2nDjcnLyz', 'man at the garden', 233],
        ['5S8VwnB4sLi6W0lYTWYylu', 'hey now', 217, 'Dody6'], ['0RgjEkSbeuStKfT2Pa4Zai', 'reincarnated', 276], ['0aB0v4027ukVziUGwVGYpG', 'tv off', 221, 'Lefty Gunplay'],
        ['4K1Pg0FLno1ltzX3jeqT83', 'dodger blue', 131, 'Wallie the Sensei, Siete7x, Roddy Ricch'], ['2Uts1QFB4u2YNIMiqcb4de', 'peekaboo', 156, 'AZ Chike'], ['1SGvjfc85yzqKXsfKcCxn2', 'heart pt. 6', 292],
        ['3aZptNYC6Z1YoumeqZcDcQ', 'gnx', 194, 'Hitta J3, YoungThreat, Peysoh'], ['0wgOhYnqZKjOHr6bmdz0aN', 'gloria', 288, 'SZA'],
    ] }),
];
export const coverUrl = (r) => `https://i.scdn.co/image/${r.cover}`;
export const spotifyUrl = (r) => `https://open.spotify.com/album/${r.id}`;

// The record wall: Cameron's own playlists (they play shuffled). `tracks` are
// [track id, title] (Spotify's oEmbed); Durbeezy is private, so it has neither
// tracks nor a cover (it gets a red label of its own) and plays in Spotify's order.
export const PLAYLISTS = [
    { key: 'durbeezy', title: 'Durbeezy', id: '2jERhUqabuzL8RjlmATzaE', bg: '#d4202c', tracks: [] },
    { key: 'soul', title: 'Soul', id: '5KRwB3zC6MMvkUSFHXQ4xU', bg: '#7a5a2a',
      cover: 'https://mosaic.scdn.co/300/ab67616d00001e021a78bfd58be455016242c998ab67616d00001e023f9e4c21876c27b1f20cef07ab67616d00001e02949aad45781849228a420a4bab67616d00001e02d46caefb22d460eb8ca14db0',
      tracks: [['2NIIJ5WfrK4ANNPHcOhSeb', 'Come On Home'], ['2P6Buc8kWRgShx7aHIadqu', 'Grazing In The Grass'], ['1BLXxFPDL2BT37nHKD7KrA', 'Pata Pata'], ['0xReSyPY2NLLQmhIPSvmfD', 'Ace Of Spades'],
        ['75NdzDXf3kCH9HeqlqBK8B', 'Colonial Man'], ['58CUIzSxNpQUFvTCd8tntH', 'La-La Means I Love You'], ['5O4erNlJ74PIF6kGol1ZrC', 'Could You Be Loved'], ['0niAkwpNApzAyUSPoAzxXT', 'You Are My Heart'],
        ['6tkSDxoNHMQ6eoeJGB2Q22', 'Bra'], ['4WFJlk9jTAJslKYZOUFDDa', 'Ware Wa'], ['0rgHRlsrskBEgCny6C2vm9', 'Mu Africa'], ['3YVu946Ae9EuJK421qt5Cw', 'Watoto Nyara'],
        ['2oWex6rYoQ7Bl2D9zG8d3F', 'Water No Get Enemy'], ['5rJSFuBV3QBGTrywHJt5sA', 'Coconut'], ['42HCaQAAihJZBY12wIZvyR', 'Street Fighter Mas'], ['4bJ7tMJqfYmkKgCYzaaG4B', 'C.R.E.A.M.'],
        ['6MN6yRVriszuyAVlyF8ndB', 'Coffee Cold'], ['3c07yD1n2fRvcD9wY638hg', 'Crepuscolo sul mare'], ['5vD9A79tCg9acU8jvNKkKY', 'Buddy and Lou'], ['7wNPciApOobHKG371fM2ze', 'Hamba Nam We'],
        ['0wqorlaFfScZh2Iqf9BvWD', 'Burn Out'], ['55jknvNIK018DKiwZzitmN', 'Great Heart'], ['53BYfZQM9ghtpVuQYwPnPm', 'Scatterlings of Africa'], ['6pjLhEdWPvmgsSbVRrrx7Y', 'Asimbonanga'],
        ['2Ms33RTRCT6gArrpcrPxmo', 'Feel']] },
    { key: 'amapiano', title: 'Amapiano', id: '7Gi65ioPXQKnTTcYPVpLjy', bg: '#1f6b46',
      cover: 'https://mosaic.scdn.co/300/ab67616d00001e021e5d18514ac6b2f65edc3932ab67616d00001e0220c4770bcbeeb8cf2348f8b6ab67616d00001e022f063ff67fe8dc44b33cec80ab67616d00001e02a82fecf77a9a8b1c729b084f',
      tracks: [['1gM44tVZ9pfUe9v35Stp31', 'Kwelanga 2.0', 'Tman Xpress, LeeMcKrazy'], ['4pxH1dqKimocSU5kaA4GYp', 'iThuba'], ['1djewwWkOaJGFtPaQc2MU6', 'iMpumelelo'], ['6s7t3z1Nb3xYWzLqyuq4RV', 'Esgela'],
        ['2Q7chNue0LxoNT4iKSyfbo', 'Impilo yaseSandton'], ['6ARmMd93cqRGYDP0XC6JH7', 'Possible'], ['6iKJIYuyGWZ1YTwee1FzBJ', 'Superman'], ['1BXCUkg6EgBi8nBkEswZnO', 'Dlala Captain'],
        ['3PdO57q0KLWkfWXsXQJlV6', 'Sengizwile', 'Aymos, Young Stunna'], ['7uhOIYLVWbBZ6ISBoyiMrl', 'Ke Star', 'Vigro Deep'], ['1b4kqxvf4kFuB7ACj9Lvve', '66'], ['1MgV6M26UttCBNci5WzwJw', 'Fede'],
        ['0pZ6WbPmzCxsWyJ9C8UwAg', 'Snake Park'], ['098RChmAlJHYS2CzckEFgA', 'Emsotra'], ['0W69tpGHdcTjg72v0z00UA', 'Emlanjeni'], ['5lO0adlnChR0djgs3GbCiG', 'Bala', 'SYKES']] },
];

// everything the record player can play, in one list: the wall's playlists, then the crate's albums
export const DISCS = [
    ...PLAYLISTS.map((p) => ({ ...p, kind: 'playlist', artist: 'Playlist', url: `https://open.spotify.com/playlist/${p.id}`,
        tracks: p.tracks.map(([id, name, feat]) => [id, name, 0, feat]) })),
    ...RECORDS.map((r) => ({ ...r, kind: 'album', cover: coverUrl(r), url: spotifyUrl(r) })),
];
