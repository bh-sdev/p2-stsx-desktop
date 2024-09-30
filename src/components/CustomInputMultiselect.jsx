import { forwardRef, useEffect, useRef, useState } from 'react';
import { uniqBy } from 'lodash';

import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { debounce } from 'utils';
import { VirtualScroller } from 'primereact/virtualscroller';

const ITEM_HEIGHT = 30;

const delayChange = debounce((cb) => cb(), 500);

const CustomInputMultiselect = forwardRef(function CustomInputMultiselect(props, ref) {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState('');
  const [onFocusItem, setOnFocusItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [topOpenPosition, setTopOpenPosition] = useState(false);

  const refDropdown = useRef(null);
  const refSelf = useRef(true);
  const refInput = useRef(ref);

  const refFirstShiftSelected = useRef(null);
  const refSuggestions = useRef(null);

  const suggestions = [
    ...(props.customSuggestionsStart || []),
    ...props.suggestions,
    ...(props.customSuggestionsEnd || []),
  ];

  useEffect(() => {
    if (visible && !loading) {
      const getScrollWrapper = document.querySelector('.p-scrollpanel-wrapper');
      if (getScrollWrapper) {
        if (
          refSuggestions.current.getBoundingClientRect().top +
            refSuggestions.current.getBoundingClientRect().height >
          getScrollWrapper.getBoundingClientRect().height
        ) {
          setTopOpenPosition(true);
        }
      }
    }
  }, [visible, loading]);

  useEffect(() => {
    const val = props.value?.map((data) => data[props.field]).join(', ');
    if (val.concat(',').trim() !== value.trim()) {
      setValue(val);
    }
  }, [props.value]);

  useEffect(() => {
    if (props.loading !== loading) {
      setLoading(props.loading);
    }
  }, [props.loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const ind = suggestions?.findIndex(
        (data) => data[props.field] === onFocusItem?.[props.field],
      );
      let nextIndex = e.key === 'ArrowDown' ? ind + 1 : ind - 1;
      if (nextIndex > suggestions.length - 1) nextIndex = 0;
      if (nextIndex < 0) nextIndex = suggestions.length - 1;
      refDropdown.current.scrollTo({ left: 0, top: ITEM_HEIGHT * nextIndex });
      setOnFocusItem(suggestions[nextIndex]);
    }
    if (e.key === 'Enter' && onFocusItem) {
      e.preventDefault();
      onSelect(e, onFocusItem);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setVisible(false);
    }
  };

  useEffect(() => {
    if (props.shouldCompleteMethodSend && props.suggestions.length) {
      setVisible(true);
      props?.onChange(convertValue(value));
    }
  }, [props.shouldCompleteMethodSend, props.suggestions]);

  useEffect(() => {
    if (props.suggestions.length) {
      onChange({ target: { value: props.value?.map((data) => data[props.field]).join(', ') } });
    }
  }, [props.suggestions.length]);

  useEffect(() => {
    if (visible && suggestions.length) {
      window.addEventListener('keydown', handleKeyDown);
    } else {
      setOnFocusItem(null);
    }
    return () => {
      if (visible && suggestions.length) {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [visible, onFocusItem, suggestions, value]);

  const convertToType = (val) => {
    return props.type === 'number' && Number(val) ? Number(val) : val;
  };

  const convertValue = (val) => {
    const arrValues = Array.isArray(val) ? val : val.split(',');
    let result = [];
    if (props.fieldValue) {
      result = [
        ...new Set(
          arrValues
            .filter((s) => !!s.trim())
            .map((s) => {
              const Value = convertToType(props.caps ? s.trim().toUpperCase() : s.trim());
              const ID = convertToType(
                suggestions.find((data) => data[props.field] === Value)?.[props.fieldValue],
              );
              return ID;
            }),
        ),
      ];
    } else {
      result = uniqBy(
        arrValues
          .filter((s) => !!s.trim())
          .map((s) => {
            const Value = convertToType(props.caps ? s.trim().toUpperCase() : s.trim());
            const ID = convertToType(
              suggestions.find((data) => data[props.field] === Value)?.ID || Value,
            );
            return { [props.field]: Value, ID };
          }),
        'ID',
      );
    }

    return result;
  };

  const onChange = (e) => {
    if (props.readOnly) return;
    if (
      props.type == 'number' &&
      e.target.value.split(',').pop() &&
      !Number(e.target.value.split(',').pop())
    )
      return;

    delayChange(() => props?.onChange(convertValue(e.target.value)));
    setValue(e.target.value);
  };

  const onSelect = (e, data, index) => {
    refSelf.current = true;
    refInput.current.focus();
    const VAL = value && value[value.length - 1] !== ',' ? `${value},` : value;
    if (e.shiftKey) {
      const rangeData = suggestions
        .slice(
          refFirstShiftSelected.current > index ? index : refFirstShiftSelected.current,
          refFirstShiftSelected.current < index ? index : refFirstShiftSelected.current + 1,
        )
        .filter(
          ({ Name }) =>
            !VAL.split(',').find((s) => s.trim().toLocaleLowerCase() === Name.toLocaleLowerCase()),
        );
      props?.onChange(convertValue(`${VAL}${rangeData.map(({ Name }) => Name).join(',')},`));
      refFirstShiftSelected.current = index;
      return;
    }
    if (
      VAL.split(',').find(
        (s) => s.trim().toLocaleLowerCase() === String(data[props.field]).toLocaleLowerCase(),
      )
    ) {
      props?.onChange(
        convertValue(
          VAL.split(',').filter(
            (s) => s.trim().toLocaleLowerCase() !== String(data[props.field]).toLocaleLowerCase(),
          ),
        ),
      );
      !props.multiWithoutCtrl && setVisible(false);
      refFirstShiftSelected.current = null;
      return;
    }
    refFirstShiftSelected.current = index;
    props?.onChange(convertValue(`${VAL}${data[props.field]},`));
    !props.multiWithoutCtrl && setVisible(false);
  };

  const onBlur = () => {
    refSelf.current = false;
    setTimeout(() => {
      if (!refSelf.current) {
        setVisible(false);
      }
    }, 300);
  };

  const getHeight = () => {
    return suggestions.length <= 7 ? suggestions.length * ITEM_HEIGHT + 2 : 200;
  };

  return (
    <div
      className={`flex relative ${props.className}`}
      style={{ flexShrink: 0, height: 22 }}
      onFocus={() => (refSelf.current = true)}
    >
      <InputText
        ref={refInput}
        disabled={props.disabled}
        placeholder={props.placeholder}
        value={value}
        onChange={onChange}
        className="w-full"
        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
        onBlur={onBlur}
        onFocus={() => {
          refSelf.current = true;
          if (props.shouldCompleteMethodSend) {
            setLoading(true);
            props?.completeMethod('');
          }
        }}
        onKeyDown={(e) => {
          if (!visible && e.key === 'Enter') {
            setVisible((prev) => !prev);
            if (props.shouldCompleteMethodSend) {
              setLoading(true);
              props?.completeMethod('');
            }
          }
        }}
      />
      <i
        className="pi pi-spin pi-spinner absolute"
        style={{
          right: '35px',
          top: '5px',
          visibility: props?.loading ? 'visible' : 'hidden',
          opacity: props?.loading ? 1 : 0,
        }}
      />
      <div
        className={classNames({
          flex: true,
          'align-items-center': true,
          'justify-content-center': true,
          'cursor-pointer': true,
          'p-disabled': props.disabled,
          'fill-height': true,
          'hover:bg-primary-400': true,
          'active:bg-primary-500': true,
          'transition-all': true,
          'transition-duration-200': true,
        })}
        style={{
          background: 'var(--primary-color)',
          width: '2.357rem',
          borderTopRightRadius: 4,
          borderBottomRightRadius: 4,
          flexShrink: 0,
        }}
        onClick={() => {
          refInput.current.focus();
          setVisible((prev) => !prev);
          if (props.shouldCompleteMethodSend) {
            setLoading(true);
            props?.completeMethod('');
          }
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="p-icon text-white text-xl"
          aria-hidden="true"
        >
          <path
            d="M7.01744 10.398C6.91269 10.3985 6.8089 10.378 6.71215 10.3379C6.61541 10.2977 6.52766 10.2386 6.45405 10.1641L1.13907 4.84913C1.03306 4.69404 0.985221 4.5065 1.00399 4.31958C1.02276 4.13266 1.10693 3.95838 1.24166 3.82747C1.37639 3.69655 1.55301 3.61742 1.74039 3.60402C1.92777 3.59062 2.11386 3.64382 2.26584 3.75424L7.01744 8.47394L11.769 3.75424C11.9189 3.65709 12.097 3.61306 12.2748 3.62921C12.4527 3.64535 12.6199 3.72073 12.7498 3.84328C12.8797 3.96582 12.9647 4.12842 12.9912 4.30502C13.0177 4.48162 12.9841 4.662 12.8958 4.81724L7.58083 10.1322C7.50996 10.2125 7.42344 10.2775 7.32656 10.3232C7.22968 10.3689 7.12449 10.3944 7.01744 10.398Z"
            fill="currentColor"
          ></path>
        </svg>
      </div>

      <div
        ref={refSuggestions}
        className={classNames({
          'w-full': true,
          'left-0': true,
          'top-100': !topOpenPosition,
          'bottom-100': topOpenPosition,
          'z-1': true,
          'bg-white': true,
          'shadow-3': true,
          'overflow-auto': true,
          'border-round': true,
          fadein: true,
          absolute: true,
        })}
        style={{
          visibility: !loading && visible ? 'visible' : 'hidden',
          opacity: !loading && visible ? 1 : 0,
        }}
      >
        {!suggestions.length ? (
          <h4 style={{ height: getHeight() }} className="flex align-items-center px-2">
            No data
          </h4>
        ) : (
          <VirtualScroller
            style={{ width: '100%', height: getHeight() }}
            ref={refDropdown}
            items={suggestions}
            itemSize={ITEM_HEIGHT}
            itemTemplate={(data, options) => (
              <div
                className="px-2 cursor-pointer flex align-items-center hover:surface-200"
                key={options.index}
                onClick={(e) => onSelect(e, data, options.index)}
                style={{
                  background:
                    onFocusItem?.[props.field] === data[props.field]
                      ? 'var(--primaryLight-200)'
                      : value
                          .split(',')
                          .find(
                            (s) =>
                              s.trim().toLocaleLowerCase() ===
                              String(data[props.field]).toLocaleLowerCase(),
                          )
                      ? 'var(--primaryLight-500)'
                      : '',
                  height: ITEM_HEIGHT,
                }}
              >
                {props.itemTemplate(data, options.index)}
              </div>
            )}
            className="border-1 surface-border border-round"
          />
        )}
      </div>
    </div>
  );
});

export default CustomInputMultiselect;
