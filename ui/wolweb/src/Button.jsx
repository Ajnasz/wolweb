import classNames from 'classnames';
export function Button({ children, onClick, className }) {
  return <button
            type="button"
            className={classNames('text-sm px-4 py-2 border rounded-sm cursor-pointer bg-surface text-accent border-accent hover:border-accent-hover focus:outline-hidden focus:border-none focus:ring-2 focus:ring-accent-hover', className)}
            onClick={onClick}>{children}</button>
}
export function ButtonTxt({ children, onClick }) {
  return <button onClick={onClick} className="cursor-pointer transition transition-colors duration-150 text-accent hover:text-accent-hover focus:outline-none focus:border-none focus:ring-2 focus:ring-accent-hover">{children}</button>
}
