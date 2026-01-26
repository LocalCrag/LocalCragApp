## [1.25.2](https://github.com/LocalCrag/LocalCragApp/compare/v1.25.1...v1.25.2) (2026-01-26)


### Bug Fixes

* **core:** add missing package to make release pipeline work ([#930](https://github.com/LocalCrag/LocalCragApp/issues/930)) ([128dae7](https://github.com/LocalCrag/LocalCragApp/commit/128dae76d8c7b15809fc7e0b1c2e43601325c3ef))
* fix release sed command ([#931](https://github.com/LocalCrag/LocalCragApp/issues/931)) ([1a6d8b8](https://github.com/LocalCrag/LocalCragApp/commit/1a6d8b82eada83bfbc83030ce48d63a7772510de))
* update helm chart structure to work with argocd ([#929](https://github.com/LocalCrag/LocalCragApp/issues/929)) ([3d17c58](https://github.com/LocalCrag/LocalCragApp/commit/3d17c586f528edb10db2b90309dd7c30c990cb4a))

## [1.25.1](https://github.com/LocalCrag/LocalCragApp/compare/v1.25.0...v1.25.1) (2026-01-23)


### Bug Fixes

* **posts:** WYSIWYG editor file upload can now handle array responses ([#926](https://github.com/LocalCrag/LocalCragApp/issues/926)) ([b067527](https://github.com/LocalCrag/LocalCragApp/commit/b067527b52fe42d143885050e4992aaa2746a238))

# [1.25.0](https://github.com/LocalCrag/LocalCragApp/compare/v1.24.0...v1.25.0) (2025-12-06)


### Features

* **comments:** add possibility to post comments on lines, crags, etc ([#857](https://github.com/LocalCrag/LocalCragApp/issues/857)) ([89d8095](https://github.com/LocalCrag/LocalCragApp/commit/89d80953a1a14d856200d38161739d81e7686fe5))

# [1.24.0](https://github.com/LocalCrag/LocalCragApp/compare/v1.23.4...v1.24.0) (2025-10-26)


### Features

* **account:** add possibility to delete your own account ([#806](https://github.com/LocalCrag/LocalCragApp/issues/806)) ([8b6cbc5](https://github.com/LocalCrag/LocalCragApp/commit/8b6cbc57935c7049c516caf6514fa64e50cb89fb)), closes [#764](https://github.com/LocalCrag/LocalCragApp/issues/764)
* **ascents:** add option to disable logging first ascents for an instance ([#811](https://github.com/LocalCrag/LocalCragApp/issues/811)) ([3241281](https://github.com/LocalCrag/LocalCragApp/commit/3241281268ee15f6f6953c3d2c390695e2e1891c)), closes [#757](https://github.com/LocalCrag/LocalCragApp/issues/757)
* **core:** replace bg images ([#813](https://github.com/LocalCrag/LocalCragApp/issues/813)) ([9a32a8a](https://github.com/LocalCrag/LocalCragApp/commit/9a32a8a152cff1ca783c7f6dd1c2110fc4abcba8)), closes [#591](https://github.com/LocalCrag/LocalCragApp/issues/591)


### Performance Improvements

* **core:** move some dependencies to devDependencies which were falsely bundled as dependency ([#800](https://github.com/LocalCrag/LocalCragApp/issues/800)) ([c3414ea](https://github.com/LocalCrag/LocalCragApp/commit/c3414ea1322a6b91e7d7b8512f4f190abb7e22a0)), closes [#701](https://github.com/LocalCrag/LocalCragApp/issues/701)

## [1.23.4](https://github.com/LocalCrag/LocalCragApp/compare/v1.23.3...v1.23.4) (2025-10-16)


### Bug Fixes

* **ascents, topo, todos:** disable buttons and remove alert while the first page of data is loading ([#797](https://github.com/LocalCrag/LocalCragApp/issues/797)) ([8f8dc93](https://github.com/LocalCrag/LocalCragApp/commit/8f8dc93cc5698ea2907713e6ebd3c5c683ca9157))
* **core:** fix an issue where old translation files could be cached after updating the LC version ([#796](https://github.com/LocalCrag/LocalCragApp/issues/796)) ([d29ec40](https://github.com/LocalCrag/LocalCragApp/commit/d29ec4077dfd18a6bb7a8ee421c60ddd789f1d1f)), closes [#770](https://github.com/LocalCrag/LocalCragApp/issues/770)
* **core:** remove insecure config defaults and enhance config validation ([#789](https://github.com/LocalCrag/LocalCragApp/issues/789)) ([c6763ff](https://github.com/LocalCrag/LocalCragApp/commit/c6763ff4c5da33e7d1c50ef457a78b67cca2d814)), closes [#772](https://github.com/LocalCrag/LocalCragApp/issues/772)
* **core:** show info messages if data is missing instead of empty graphs etc ([#799](https://github.com/LocalCrag/LocalCragApp/issues/799)) ([fa9eba1](https://github.com/LocalCrag/LocalCragApp/commit/fa9eba1853007c0770409096732df8a411d8511f)), closes [#739](https://github.com/LocalCrag/LocalCragApp/issues/739)
* **gallery:** fix an issue where navigation was triggered by accident when submitting gallery images ([#788](https://github.com/LocalCrag/LocalCragApp/issues/788)) ([234b0f3](https://github.com/LocalCrag/LocalCragApp/commit/234b0f3dbcd82e754562c6146e41271630e72942)), closes [#686](https://github.com/LocalCrag/LocalCragApp/issues/686)
* **search:** fix elliptic avatars that should be circle shaped ([#795](https://github.com/LocalCrag/LocalCragApp/issues/795)) ([f32bb7d](https://github.com/LocalCrag/LocalCragApp/commit/f32bb7d680370f39457128d5cc96d621ee30af63)), closes [#792](https://github.com/LocalCrag/LocalCragApp/issues/792)
* **topo:** line deletion buttons in batch line editor are now danger instead of primary volor ([#787](https://github.com/LocalCrag/LocalCragApp/issues/787)) ([fb1880e](https://github.com/LocalCrag/LocalCragApp/commit/fb1880e4703ce84f07a66c020d833e9c6481c597)), closes [#767](https://github.com/LocalCrag/LocalCragApp/issues/767)

## [1.23.3](https://github.com/LocalCrag/LocalCragApp/compare/v1.23.2...v1.23.3) (2025-10-16)


### Bug Fixes

* **ascents:** fix logging ascents when providing year instead of date ([#786](https://github.com/LocalCrag/LocalCragApp/issues/786)) ([9a23b16](https://github.com/LocalCrag/LocalCragApp/commit/9a23b16711af70d5157273745737abf124ff23d8))

## [1.23.2](https://github.com/LocalCrag/LocalCragApp/compare/v1.23.1...v1.23.2) (2025-10-14)


### Bug Fixes

* **core:** add missing lambda to database default datetimes ([#785](https://github.com/LocalCrag/LocalCragApp/issues/785)) ([c35322a](https://github.com/LocalCrag/LocalCragApp/commit/c35322a52b3c643e71b8c9b43266b04dffc99a46))

## [1.23.1](https://github.com/LocalCrag/LocalCragApp/compare/v1.23.0...v1.23.1) (2025-10-12)


### Bug Fixes

* **account:** add missing count of ungraded lines to user grade distribution bar chart ([#783](https://github.com/LocalCrag/LocalCragApp/issues/783)) ([4182f66](https://github.com/LocalCrag/LocalCragApp/commit/4182f6646754dd937e7efbc510f8a411319c9164)), closes [#705](https://github.com/LocalCrag/LocalCragApp/issues/705)
* **ascents:** fix issue where avatars could be elliptic instead of circle shaped ([#784](https://github.com/LocalCrag/LocalCragApp/issues/784)) ([8b6213a](https://github.com/LocalCrag/LocalCragApp/commit/8b6213aed6b0600b60875709fb389420b7e1aeab)), closes [#684](https://github.com/LocalCrag/LocalCragApp/issues/684)
* **core:** fix user menu point being highlighted when account page is active ([#782](https://github.com/LocalCrag/LocalCragApp/issues/782)) ([ead7399](https://github.com/LocalCrag/LocalCragApp/commit/ead7399783cb81f808158b975a6518e6eb9a18cf)), closes [#738](https://github.com/LocalCrag/LocalCragApp/issues/738)
* **gallery:** fix gallery menu item links when hierarchy levels are skipped ([#781](https://github.com/LocalCrag/LocalCragApp/issues/781)) ([9efac7c](https://github.com/LocalCrag/LocalCragApp/commit/9efac7cd7d16e55d6552cb33942fdc1c2217615f)), closes [#756](https://github.com/LocalCrag/LocalCragApp/issues/756)
* **topo:** line breadcrumbs now respect hierarchy levels ([#780](https://github.com/LocalCrag/LocalCragApp/issues/780)) ([fbe87fd](https://github.com/LocalCrag/LocalCragApp/commit/fbe87fd1c987d41f9442d399d71ffd9f43c78a26)), closes [#778](https://github.com/LocalCrag/LocalCragApp/issues/778)

# [1.23.0](https://github.com/LocalCrag/LocalCragApp/compare/v1.22.1...v1.23.0) (2025-10-10)


### Bug Fixes

* **ascents:** fix issue where utc timeoffset was causing logs near midnight not to work ([#779](https://github.com/LocalCrag/LocalCragApp/issues/779)) ([5eb9775](https://github.com/LocalCrag/LocalCragApp/commit/5eb977505d1625b0e8f328d6e496048d09eeab17)), closes [#685](https://github.com/LocalCrag/LocalCragApp/issues/685)


### Features

* **gym:** archiving a topo image can conditionally also archive all attached lines ([#776](https://github.com/LocalCrag/LocalCragApp/issues/776)) ([0b755e7](https://github.com/LocalCrag/LocalCragApp/commit/0b755e7e6a9dc6c4a01e577b937c4683414adeed)), closes [#760](https://github.com/LocalCrag/LocalCragApp/issues/760)
* **ranking:** add possibility to set the number of considered weeks for rankings ([#777](https://github.com/LocalCrag/LocalCragApp/issues/777)) ([021c671](https://github.com/LocalCrag/LocalCragApp/commit/021c671b8be3381b873f1502cb813576d4286584)), closes [#582](https://github.com/LocalCrag/LocalCragApp/issues/582)

## [1.22.1](https://github.com/LocalCrag/LocalCragApp/compare/v1.22.0...v1.22.1) (2025-10-06)


### Bug Fixes

* **account:** fix progress calculation with active grade filters ([#773](https://github.com/LocalCrag/LocalCragApp/issues/773)) ([cda3111](https://github.com/LocalCrag/LocalCragApp/commit/cda311100da23b637f3fa64d0e27ee5336575dc2))
* **ascents:** hide skipped hierarchy levels in ascent list ([#775](https://github.com/LocalCrag/LocalCragApp/issues/775)) ([8d66a13](https://github.com/LocalCrag/LocalCragApp/commit/8d66a1357de5ca7651926ab78a421f3ba5175cd8)), closes [#761](https://github.com/LocalCrag/LocalCragApp/issues/761)
* **topo:** fix line path and topo image ordering if there exist archived lines and topo images ([#774](https://github.com/LocalCrag/LocalCragApp/issues/774)) ([8d8ff39](https://github.com/LocalCrag/LocalCragApp/commit/8d8ff39b3be58adc69ae93f9ee997fecac693795)), closes [#758](https://github.com/LocalCrag/LocalCragApp/issues/758)

# [1.22.0](https://github.com/LocalCrag/LocalCragApp/compare/v1.21.0...v1.22.0) (2025-10-01)


### Features

* **topo:** add laydown start ([#768](https://github.com/LocalCrag/LocalCragApp/issues/768)) ([7ea6fda](https://github.com/LocalCrag/LocalCragApp/commit/7ea6fdae4fb64bc2175ec018c6a52d0b0c2868c3))
* **topo:** configurable default starting position ([#769](https://github.com/LocalCrag/LocalCragApp/issues/769)) ([10940b4](https://github.com/LocalCrag/LocalCragApp/commit/10940b40db6164f6abe509c86f71a9a1a2aad4c0))

# [1.21.0](https://github.com/LocalCrag/LocalCragApp/compare/v1.20.0...v1.21.0) (2025-09-29)


### Features

* **topo:** line batch editor ([#766](https://github.com/LocalCrag/LocalCragApp/issues/766)) ([3665c53](https://github.com/LocalCrag/LocalCragApp/commit/3665c53f2403648048bc493209bee4ce247788dc))

# [1.20.0](https://github.com/LocalCrag/LocalCragApp/compare/v1.19.3...v1.20.0) (2025-08-05)


### Bug Fixes

* **topo:** fix editing first ascent date ([#752](https://github.com/LocalCrag/LocalCragApp/issues/752)) ([137c6c2](https://github.com/LocalCrag/LocalCragApp/commit/137c6c229b984dc8fe2690ecbc3d17ce8e1f7d29))


### Features

* **topo:** add option to specify the first ascent date as date, not only year ([#751](https://github.com/LocalCrag/LocalCragApp/issues/751)) ([d474afc](https://github.com/LocalCrag/LocalCragApp/commit/d474afc2988ef60b02b71694db7f2cfa6202c821)), closes [#706](https://github.com/LocalCrag/LocalCragApp/issues/706)
* **topo:** allow setting display of user grades and ratings separately ([#753](https://github.com/LocalCrag/LocalCragApp/issues/753)) ([bff0cbd](https://github.com/LocalCrag/LocalCragApp/commit/bff0cbd9935442c8c351204235be4ea2a51e6c0f)), closes [#707](https://github.com/LocalCrag/LocalCragApp/issues/707)

## [1.19.3](https://github.com/LocalCrag/LocalCragApp/compare/v1.19.2...v1.19.3) (2025-07-11)


### Bug Fixes

* **ascents:** fix serialization of ascents to utc ([#749](https://github.com/LocalCrag/LocalCragApp/issues/749)) ([6bc80e4](https://github.com/LocalCrag/LocalCragApp/commit/6bc80e4241543d9ae86d8fa152e35ffa47e5a790))

## [1.19.2](https://github.com/LocalCrag/LocalCragApp/compare/v1.19.1...v1.19.2) (2025-07-06)


### Bug Fixes

* **ascents:** ascent list doesn't show no ascents alert while it's still loading anymore ([#731](https://github.com/LocalCrag/LocalCragApp/issues/731)) ([c67e05b](https://github.com/LocalCrag/LocalCragApp/commit/c67e05b51ec6ec9d71813c222d752e0207481d04)), closes [#721](https://github.com/LocalCrag/LocalCragApp/issues/721)
* **ascents:** fix an issue where ascents could not be ordered by grades anymore ([#734](https://github.com/LocalCrag/LocalCragApp/issues/734)) ([c1ec30a](https://github.com/LocalCrag/LocalCragApp/commit/c1ec30a8da3b0d75969d608606086a1042fa95ff)), closes [#729](https://github.com/LocalCrag/LocalCragApp/issues/729)
* **core:** docker postgres extensions are now installed via migration ([#744](https://github.com/LocalCrag/LocalCragApp/issues/744)) ([cbb3c13](https://github.com/LocalCrag/LocalCragApp/commit/cbb3c1312116c101db9b22c56d8c83e6e1016bdd))

## [1.19.1](https://github.com/LocalCrag/LocalCragApp/compare/v1.19.0...v1.19.1) (2025-06-21)


### Bug Fixes

* **ranking:** ranking ui adapts to prevalent line type ([#724](https://github.com/LocalCrag/LocalCragApp/issues/724)) ([69036dc](https://github.com/LocalCrag/LocalCragApp/commit/69036dca31caf1b5324b9d0974dfc2f00422dbfe)), closes [#652](https://github.com/LocalCrag/LocalCragApp/issues/652)
* **search:** improve relevance of search results ([#723](https://github.com/LocalCrag/LocalCragApp/issues/723)) ([f9e25b3](https://github.com/LocalCrag/LocalCragApp/commit/f9e25b3c800d4036c9090a94f8e75e5f6d282ef1)), closes [#317](https://github.com/LocalCrag/LocalCragApp/issues/317)

# [1.19.0](https://github.com/LocalCrag/LocalCragApp/compare/v1.18.1...v1.19.0) (2025-06-04)


### Features

* better cookie button label ([#710](https://github.com/LocalCrag/LocalCragApp/issues/710)) ([3fd5817](https://github.com/LocalCrag/LocalCragApp/commit/3fd581741ae54b96714312a7ac0caf2d980d3bce)), closes [#648](https://github.com/LocalCrag/LocalCragApp/issues/648)

## [1.18.1](https://github.com/LocalCrag/LocalCragApp/compare/v1.18.0...v1.18.1) (2025-06-03)


### Bug Fixes

* **history:** history page does not crash anymore ([#708](https://github.com/LocalCrag/LocalCragApp/issues/708)) ([a814426](https://github.com/LocalCrag/LocalCragApp/commit/a8144262a0002e516db41401fe813c3373beb671))

# [1.18.0](https://github.com/LocalCrag/LocalCragApp/compare/v1.17.1...v1.18.0) (2025-05-24)


### Features

* **topo:** add closed reason in list views ([#700](https://github.com/LocalCrag/LocalCragApp/issues/700)) ([acf9ed2](https://github.com/LocalCrag/LocalCragApp/commit/acf9ed2c505dd4ec538d75975af6ef080c1150c4))

## [1.17.1](https://github.com/LocalCrag/LocalCragApp/compare/v1.17.0...v1.17.1) (2025-05-20)


### Bug Fixes

* add back missing ratings in line list ([#697](https://github.com/LocalCrag/LocalCragApp/issues/697)) ([499087d](https://github.com/LocalCrag/LocalCragApp/commit/499087df91a9f6a8649e28807f7715b5c8296f6e))
* ascents cannot be logged around midnight ([#696](https://github.com/LocalCrag/LocalCragApp/issues/696)) ([69bc54c](https://github.com/LocalCrag/LocalCragApp/commit/69bc54c6651c7ab975cc813fb074526ddb11f7ef))
* **ascents:** ascent lists do not contain wrong data anymore ([#691](https://github.com/LocalCrag/LocalCragApp/issues/691)) ([be8ea49](https://github.com/LocalCrag/LocalCragApp/commit/be8ea49ecffd4769cad4d5d05f74d04a7458e02d)), closes [#687](https://github.com/LocalCrag/LocalCragApp/issues/687)
* don't show gallery loading skeleton when no images are loading ([#694](https://github.com/LocalCrag/LocalCragApp/issues/694)) ([b4debe1](https://github.com/LocalCrag/LocalCragApp/commit/b4debe1a333d823bcd83c996df901c29770dc228)), closes [#680](https://github.com/LocalCrag/LocalCragApp/issues/680)
* line form fa year is not initialized in edit mode ([#698](https://github.com/LocalCrag/LocalCragApp/issues/698)) ([639d84a](https://github.com/LocalCrag/LocalCragApp/commit/639d84a082ab9cd061af44e769fde81661f504a7))
* make bar chart labels visible again ([#695](https://github.com/LocalCrag/LocalCragApp/issues/695)) ([02a9e00](https://github.com/LocalCrag/LocalCragApp/commit/02a9e00407adf4fc3357e536b206dc931c3a1ab6))
* voting calculated wrong user grades ([#699](https://github.com/LocalCrag/LocalCragApp/issues/699)) ([1d9d6a1](https://github.com/LocalCrag/LocalCragApp/commit/1d9d6a1378d1fe5ed534176f8455855936aebb06))

# [1.17.0](https://github.com/LocalCrag/LocalCragApp/compare/v1.16.3...v1.17.0) (2025-05-17)


### Features

* **ascents:** ascents can influence the line grade ([#654](https://github.com/LocalCrag/LocalCragApp/issues/654)) ([156081d](https://github.com/LocalCrag/LocalCragApp/commit/156081d2fc4c25cd6c03d75f7c98d6c5024c8f40)), closes [#653](https://github.com/LocalCrag/LocalCragApp/issues/653)

## [1.16.3](https://github.com/LocalCrag/LocalCragApp/compare/v1.16.2...v1.16.3) (2025-04-15)


### Bug Fixes

* **core:** remove fileinput capture attribute that forces capture on mobile ([#679](https://github.com/LocalCrag/LocalCragApp/issues/679)) ([d8278bb](https://github.com/LocalCrag/LocalCragApp/commit/d8278bb2657a75b1fd2747446e4f214a10e7a688))

## [1.16.2](https://github.com/LocalCrag/LocalCragApp/compare/v1.16.1...v1.16.2) (2025-04-15)


### Bug Fixes

* **core:** prevent multiple header menus being open at the same time ([#674](https://github.com/LocalCrag/LocalCragApp/issues/674)) ([a3c1b2c](https://github.com/LocalCrag/LocalCragApp/commit/a3c1b2c83f9dc11499abb48ae9c73992d9eef0e7)), closes [#386](https://github.com/LocalCrag/LocalCragApp/issues/386)
* **core:** set max width to content container ([#677](https://github.com/LocalCrag/LocalCragApp/issues/677)) ([3e65f5a](https://github.com/LocalCrag/LocalCragApp/commit/3e65f5a96641dc8ce71513119094b287121023dd)), closes [#645](https://github.com/LocalCrag/LocalCragApp/issues/645)
* **search:** change elliptical search item avatars to circular avatars ([#669](https://github.com/LocalCrag/LocalCragApp/issues/669)) ([246f1fa](https://github.com/LocalCrag/LocalCragApp/commit/246f1faf3114152f0a39f443d1998d47de234f33))
* **topo:** allow camera capture for the file upload ([#665](https://github.com/LocalCrag/LocalCragApp/issues/665)) ([af9ee84](https://github.com/LocalCrag/LocalCragApp/commit/af9ee84aee2936743ac0ad4cdc112b772e3129f0))
* **topo:** fix barchart and stacked chart numbers to correctly include ungraded lines ([#670](https://github.com/LocalCrag/LocalCragApp/issues/670)) ([28060ad](https://github.com/LocalCrag/LocalCragApp/commit/28060add04981297586d7451b78548032a9623e6)), closes [#646](https://github.com/LocalCrag/LocalCragApp/issues/646)
* **topo:** fix issue where line style description was wrapping below line name in topo image view ([#678](https://github.com/LocalCrag/LocalCragApp/issues/678)) ([137ec11](https://github.com/LocalCrag/LocalCragApp/commit/137ec114e0e97e97758ee58ba5f06e021c9ab606)), closes [#664](https://github.com/LocalCrag/LocalCragApp/issues/664)
* **topo:** fix null pointer error in line ascents list ([#675](https://github.com/LocalCrag/LocalCragApp/issues/675)) ([e4ce001](https://github.com/LocalCrag/LocalCragApp/commit/e4ce001d81f67fef6f8ece7a7d45a5671deaf8d3))
* **topo:** numbers of unhovered lines are no longer layered above the highlighted hovered line path ([#673](https://github.com/LocalCrag/LocalCragApp/issues/673)) ([2cf67eb](https://github.com/LocalCrag/LocalCragApp/commit/2cf67eb0299627180b105f01ce6ebaf65239c200)), closes [#445](https://github.com/LocalCrag/LocalCragApp/issues/445)
* **topo:** prevent data to be reloaded on vertical swipes started on sliders [#671](https://github.com/LocalCrag/LocalCragApp/issues/671) ([#672](https://github.com/LocalCrag/LocalCragApp/issues/672)) ([72e9548](https://github.com/LocalCrag/LocalCragApp/commit/72e9548a9f7620582d25805e268b1e7e3b1dc82c)), closes [#643](https://github.com/LocalCrag/LocalCragApp/issues/643)
* **topo:** trying to access a secret spot url without permission navigates to not found page ([#676](https://github.com/LocalCrag/LocalCragApp/issues/676)) ([1a45a2d](https://github.com/LocalCrag/LocalCragApp/commit/1a45a2d95ff5420f13aebddf242bfae7011047dd)), closes [#351](https://github.com/LocalCrag/LocalCragApp/issues/351)

## [1.16.1](https://github.com/LocalCrag/LocalCragApp/compare/v1.16.0...v1.16.1) (2025-04-05)


### Bug Fixes

* update out of date piplock file ([61f7382](https://github.com/LocalCrag/LocalCragApp/commit/61f73821c3795f8ec079e06b42146a22b74b0554))

# [1.16.0](https://github.com/LocalCrag/LocalCragApp/compare/v1.15.0...v1.16.0) (2025-04-05)


### Features

* migrate to Angular 19 and primeng 19 ([#647](https://github.com/LocalCrag/LocalCragApp/issues/647)) ([40c1e53](https://github.com/LocalCrag/LocalCragApp/commit/40c1e5388aedf4b2abed606265c93c55f754da3a))

# [1.15.0](https://github.com/LocalCrag/LocalCragApp/compare/v1.14.6...v1.15.0) (2025-02-28)


### Bug Fixes

* **topo:** fix grade distribution bar chart displayed total count ([#636](https://github.com/LocalCrag/LocalCragApp/issues/636)) ([ec34686](https://github.com/LocalCrag/LocalCragApp/commit/ec346865f52d94869937771414c1ace74f58299d))
* **ui:** colorpicker is no longer partially hidden ([#620](https://github.com/LocalCrag/LocalCragApp/issues/620)) ([c7dd715](https://github.com/LocalCrag/LocalCragApp/commit/c7dd7154c23696a6ef6d241b7205a698265efed2))
* **ux:** drawn lines are clickable when adding new lines ([#609](https://github.com/LocalCrag/LocalCragApp/issues/609)) ([f3fd943](https://github.com/LocalCrag/LocalCragApp/commit/f3fd943741eb368da88f29d2e8ab600516cf496c))


### Features

* **ui:** logo, header menu entries and crag/sector/area lists have real <a> links ([#616](https://github.com/LocalCrag/LocalCragApp/issues/616)) ([7909fc2](https://github.com/LocalCrag/LocalCragApp/commit/7909fc216cc97c988ff41c4a923f78dc5bafd5d6)), closes [#490](https://github.com/LocalCrag/LocalCragApp/issues/490)

## [1.14.6](https://github.com/LocalCrag/LocalCragApp/compare/v1.14.5...v1.14.6) (2025-02-26)


### Bug Fixes

* **core:** delete unused translation ([#634](https://github.com/LocalCrag/LocalCragApp/issues/634)) ([8881e40](https://github.com/LocalCrag/LocalCragApp/commit/8881e4083e0e46a5790b6eab9948977eb8610497))

## [1.14.5](https://github.com/LocalCrag/LocalCragApp/compare/v1.14.4...v1.14.5) (2025-02-26)


### Bug Fixes

* **topo:** fix inconsistent translation ([#633](https://github.com/LocalCrag/LocalCragApp/issues/633)) ([1a0ddde](https://github.com/LocalCrag/LocalCragApp/commit/1a0ddde660813fb2d9f9d686751c78d551c6d886)), closes [#589](https://github.com/LocalCrag/LocalCragApp/issues/589)

## [1.14.4](https://github.com/LocalCrag/LocalCragApp/compare/v1.14.3...v1.14.4) (2025-02-26)


### Bug Fixes

* **topo:** fix typo ([#629](https://github.com/LocalCrag/LocalCragApp/issues/629)) ([a23afee](https://github.com/LocalCrag/LocalCragApp/commit/a23afeed68ff6011814f474b442e923e007cbe34))

## [1.14.3](https://github.com/LocalCrag/LocalCragApp/compare/v1.14.2...v1.14.3) (2025-02-26)


### Bug Fixes

* **translations:** fix gym translation for FA ([#606](https://github.com/LocalCrag/LocalCragApp/issues/606)) ([97db3d5](https://github.com/LocalCrag/LocalCragApp/commit/97db3d5a724f85e048086c1701ce74f42346e2b5))
* **ui:** fix coloring of line indices in topo image list ([#608](https://github.com/LocalCrag/LocalCragApp/issues/608)) ([b0b7174](https://github.com/LocalCrag/LocalCragApp/commit/b0b7174be07bda9b901336e0fb8ff2376235d895))
