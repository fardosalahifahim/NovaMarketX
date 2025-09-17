import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './CategoriesSectionMobile.css';

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

const CategoriesSectionMobile = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsToShow = 4;

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex + cardsToShow >= categories.length ? 0 : prevIndex + cardsToShow
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex - cardsToShow < 0 ? Math.max(categories.length - cardsToShow, 0) : prevIndex - cardsToShow
    );
  };

  const visibleCategories = categories.slice(currentIndex, currentIndex + cardsToShow);
  if (visibleCategories.length < cardsToShow) {
    visibleCategories.push(...categories.slice(0, cardsToShow - visibleCategories.length));
  }

  return (
    <section className="categories-section-mobile-new">
      {/* Removed Shop by Category heading as requested */}
      <div className="slider-container-new">
        {/* Removed slider buttons as requested */}
        <div className="slider-cards-new">
          {visibleCategories.map((category, index) => (
            <div key={index} className="category-item-mobile-new">
              <Link to={category.path} className="category-link-new">
                <img src={category.img} alt={`${category.name} icon`} className="category-icon-mobile-new" />
              </Link>
              <div className="category-name-mobile-new">{category.name}</div>
              <Link to={category.path} className="see-all-button-mobile-new">
                See All
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSectionMobile;
