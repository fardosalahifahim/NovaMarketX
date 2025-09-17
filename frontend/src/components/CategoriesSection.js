import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import './CategoriesSection.css';
import CategoriesSectionMobile from './CategoriesSectionMobile';
import CategoriesSectionPhone from './CategoriesSectionPhone';

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

const CategoriesSection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsToShow = 4;
  const scrollRef = React.useRef(null);

  useLayoutEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);

    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => {
      window.removeEventListener('resize', updateIsMobile);
      clearTimeout(timer);
    };
  }, []);

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

  const categoriesToShow = [...categories, ...categories];

  return (
    <>
      <section
        className="categories-section-phone"
        style={{ display: isMobile ? 'block' : 'none' }}
      >
        {loading ? (
          <div className="loading-placeholder-phone">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="loading-item-phone"></div>
            ))}
          </div>
        ) : (
          <CategoriesSectionPhone />
        )}
      </section>

      <section
        className="categories-section"
        style={{ display: isMobile ? 'none' : 'block' }}
      >
        <div className="shop-by-category-text">Shop by category</div>
        {loading ? (
          <div className="loading-placeholder-pc">
            {[...Array(cardsToShow)].map((_, i) => (
              <div key={i} className="loading-item-pc"></div>
            ))}
          </div>
        ) : (
          <div className="categories-row" ref={scrollRef}>
            {categoriesToShow.map((category, index) => (
              <div key={index} className="category-item">
                <Link to={category.path} className="category-link">
                  <img
                    src={category.img}
                    alt={`${category.name} icon`}
                    className="category-icon"
                  />
                </Link>
                <div className="category-name">{category.name}</div>
                <Link to={category.path} className="see-all-button">
                  See All
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export default CategoriesSection;
