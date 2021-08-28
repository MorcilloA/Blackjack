class Deck {

    constructor(colors = false, numbers = false, isTrash = false) {

        this.cards = new Array();

        if (!isTrash) {
            colors.forEach(color => {
                numbers.forEach((valueInt, valueStr) => {
                    let card = new Card(color, valueStr, valueInt);
                    this.addCard(card);
                });
            });
            // console.log(this.cards[0].valueInt);
        }

    }

    pickCard() {
        let index = Math.floor(Math.random() * this.cards.length);
        return this.deleteCard(index);

    }

    addCard(card) {
        this.cards.push(card);
    }

    deleteCard(index) {
        return this.cards.splice(index, 1);
    }

}