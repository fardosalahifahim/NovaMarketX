import React from 'react';
import { Link } from 'react-router-dom';
import './CategoriesSectionPhone.css';

import fashionImg from '../icons/fashion.png';
import electronicsImg from '../icons/electronics.png';
import homeGardenImg from '../icons/home_garden.png';
import booksImg from '../icons/books.png';
import sportsOutdoorsImg from '../icons/sports_outdoors.png';
import healthBeautyImg from '../icons/health_beauty.png';
import foodGroceryImg from '../icons/food_grocery.png';
import toysGamesImg from '../icons/toys_games.png';
import automotiveImg from '../icons/automotive.png';

const categories = [
  { name: 'Fashion', path: '/category/Fashion', img: fashionImg },
  { name: 'Electronics', path: '/category/Electronics', img: electronicsImg },
  { name: 'Home & Garden', path: '/category/Home%20%26%20Garden', img: homeGardenImg },
  { name: 'Books', path: '/category/Books', img: booksImg },
  { name: 'Sports & Outdoors', path: '/category/Sports%20%26%20Outdoors', img: sportsOutdoorsImg },
  { name: 'Health & Beauty', path: '/category/Health%20%26%20Beauty', img: healthBeautyImg },
  { name: 'Food & Grocery', path: '/category/Food%20%26%20Grocery', img: foodGroceryImg },
  { name: 'Toys & Games', path: '/category/Toys%20%26%20Games', img: toysGamesImg },
  { name: 'Automotive', path: '/category/Automotive', img: automotiveImg },
];

const CategoriesSectionPhone = () => {
  // Show 3 cards per row, 2 rows total (6 cards)
  const cardsToShow = 6;
  const categoriesToShow = categories.slice(0, cardsToShow);

  return (
    <section className="categories-section-phone">
      <div className="categories-grid">
        {categoriesToShow.map((category, index) => (
          <div key={index} className="category-item-phone">
            <Link to={category.path} className="category-link-phone">
              <img src={category.img} alt={`${category.name} icon`} className="category-icon-phone" />
            </Link>
            <div className="category-name-phone">{category.name}</div>
            <Link to={category.path} className="see-all-button-phone">
              See All
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoriesSectionPhone;
