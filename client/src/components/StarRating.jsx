import "./StarRating.css";

/*
 * DOCU: Renders a row of star icons; read-only display mode or interactive
 * picker mode depending on whether onChange is provided.
 * @param {number} value - Current rating, 0-5
 * @param {Function} onChange - Optional; if given, stars become clickable
 * @param {string} size - Optional CSS font-size override
 * @returns {JSX.Element} - The star row
 *
 * Author: JC
 */
function StarRating({ value, onChange, size = "1rem" }) {
  const interactive = !!onChange;

  return (
    <span className="star-rating" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`star-rating__star ${n <= Math.round(value) ? "star-rating__star--filled" : ""} ${interactive ? "star-rating__star--interactive" : ""}`}
          onClick={interactive ? () => onChange(n) : undefined}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default StarRating;