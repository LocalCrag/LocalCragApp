# LocalCrag

Deploy your local alternative to the well known online climbing guide platforms with LocalCrag to keep control over all data in the crags you are developing!

## The idea

As developers of climbing crags you invest hours and hours of work in cleaning lines and managing the politics behind providing public access to the areas you love. A central piece of this work is also to publish information about the areas - usually by providing a paper guidebook or some form of online guide. While developing the Eifel bouldering areas our approach was to use a Wordpress site for publishing information. Like other core developers of areas we know well (e.g. Pfalz) we opted against publishing on well known big platforms as we don't want to give our data out of our hands. Because of brittle access situations we wanted to be in 100% control of all the detailed information that is the fruit of our year long engagement in cleaning all the blocks in the forest. We wanted to be able to act fast if certain events require to restrict information. Corporate interests of big platforms stand in the way of this flexibility. And also, we liked the idea of having our information accessible under our own domain.

This was all perfetly possible by just using Wordpress or some forum software like it is done in other areas. However having all the nice features of a modern topo app is very intriguing. This is why I decided to create LocalCrag. A topo webapp to manage your local climbing area information.

## Core features

- **Self-hosted:** Keep full control over all the data
- **Online topo:** Publish detailed information about crags, sectors, areas and lines 
- **Line editor:** Draw lines for boulders and routes on images with a simple click-editor
- **Ticklist:** Track your ascends and create todo lists
- **Statistics:** Numerous statistics for lines and ascends
- **News blog:** Publish news for your crags in a blog
- **Multi language:** LocalCrag is built using transloco. Adding new languages is easy and there is also the possibilits to run your instances in multiple languages.
- ... more to come! We have a lot of ideas. We are open to your ideas and accept pull requests.

## Current state

v1.0.0 is finished and deployed on https://gleesbouldering.com! More features are being added regularly now.

## Screenshots

![Lines view](docs/assets/topo-images.png "Line view")

View lines drawn on images. Hover to highlight them. Click on a line to get more information.

![Crag info](docs/assets/crag-info.png "Crag info")

Crag, sector and area information with statistics.

![Line editor](docs/assets/line-editor.png "Line editor")

Save time while creating your topo by using a simple click-editor for drawing lines.

## Installation

If you want to use LocalCrag for your own crag, follow the steps below:

1. Ask for permission first. LocalCrag is published under a closed license (couldn't find a fitting open source licence), so you will have to ask for permission to deploy an own instance. Write an email at localcrag@fengelmann.de is you are interested.
2. Either deploy yourself or join our cloud, it's up to you. If you join our cloud you will get automated updates but you will have to pay a hosting fee (we will not make money charging this fee, it's 1:1 what our cloud provider charges us).
3. Start using LocalCrag!

### Configuration

- You can configure your instance by visiting `/instance-settings`
- If you choose to use Matomo tracking, be sure to setup your Matomo instance in a way that anonymizes user data. Currently there is no opt-in cookie banner provided, so tracking has to follow your local privacy legislation.

## Contributing

LocalCrag is a (soon to be, when we decided on the licence) open-source project and we welcome contributions from the community.

If you'd like to contribute, please fork the repository and make changes as you'd like. Pull requests are warmly welcome.

### Our contributors

<a href="https://github.com/LocalCrag/LocalCragApp/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=LocalCrag/LocalCragApp" />
</a>

## License

All Rights Reserved.

I couldn't find a fitting licence that allows only non-commercial use. However I will grant any climbing and bouldering area developer the right to use LocalCrag and deploy an instance, just contact me. In the meantime I keep looking for a good license..