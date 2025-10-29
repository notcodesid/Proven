
const SearchIcon = () => {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.0001 13L10.1335 10.1333M11.6667 6.33333C11.6667 9.27885 9.27885 11.6667 6.33333 11.6667C3.38781 11.6667 1 9.27885 1 6.33333C1 3.38781 3.38781 1 6.33333 1C9.27885 1 11.6667 3.38781 11.6667 6.33333Z" stroke="#A1A1AA" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

    )
}

const CalendarIcon = () => {
    return (
        < svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" >
            <path d="M5.33334 1.33325V3.33325" stroke="white" strokeWidth="1.11111" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.6667 1.33325V3.33325" stroke="white" strokeWidth="1.11111" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.33334 6.05981H13.6667" stroke="white" strokeWidth="1.11111" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 5.66659V11.3333C14 13.3333 13 14.6666 10.6667 14.6666H5.33333C3 14.6666 2 13.3333 2 11.3333V5.66659C2 3.66659 3 2.33325 5.33333 2.33325H10.6667C13 2.33325 14 3.66659 14 5.66659Z" stroke="white" strokeWidth="1.11111" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.4631 9.13314H10.4691" stroke="white" strokeWidth="1.11111" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.4631 11.1331H10.4691" stroke="white" strokeWidth="1.11111" strokeLinecap="round"strokeLinejoin ="round" />
            <path d="M7.997 9.13314H8.00299" stroke="white" strokeWidth="1.11111" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.997 11.1331H8.00299" stroke="white" strokeWidth="1.11111" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.52953 9.13314H5.53552" stroke="white" strokeWidth="1.11111" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.52953 11.1331H5.53552" stroke="white" strokeWidth="1.11111" strokeLinecap="round" strokeLinejoin="round" />
        </svg >
    )
}

const StepsIcon = () => {
    return (
        <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_654_1803)">
                <path d="M6.06008 8.85335H8.12008V13.6533C8.12008 14.7733 8.72674 15 9.46674 14.16L14.5134 8.42668C15.1334 7.72668 14.8734 7.14668 13.9334 7.14668H11.8734V2.34668C11.8734 1.22668 11.2667 1.00001 10.5267 1.84001L5.48008 7.57335C4.86674 8.28001 5.12674 8.85335 6.06008 8.85335Z" stroke="white" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" shapeRendering="crispEdges" />
            </g>
            <defs>
                <filter id="filter0_d_654_1803" x="0.646271" y="0.83252" width="18.7057" height="22.335" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="4" />
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_654_1803" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_654_1803" result="shape" />
                </filter>
            </defs>
        </svg>

    )
}

interface IconProps {
    isActive?: boolean;
}

const HomeIcon = ({ isActive = false }: IconProps) => {
    return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
                d="M8.75 17H12.75M14.9304 21H6.56965C4.2609 21 2.3893 19.214 2.3893 17.0108V12.133C2.3893 11.4248 2.09447 10.7456 1.56969 10.2448C0.353805 9.0845 0.51187 7.16205 1.90251 6.19692L8.29124 1.763C9.75708 0.745668 11.7429 0.745668 13.2088 1.763L19.5975 6.19691C20.9881 7.16205 21.1462 9.0845 19.9303 10.2448C19.4055 10.7456 19.1107 11.4248 19.1107 12.133V17.0108C19.1107 19.214 17.2391 21 14.9304 21Z" 
                stroke={isActive ? "none" : "currentColor"} 
                fill={isActive ? "currentColor" : "none"}
                strokeWidth="1.5" 
                strokeLinecap="round"
            />
        </svg>
    )
}

const ChallengesIcon = ({ isActive = false }: IconProps) => {
    return (
        <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
                d="M15.875 4.50005C16.9795 4.50005 17.875 5.39548 17.875 6.50005M10.875 3.70259L11.5601 3.00005C13.691 0.814763 17.1459 0.814761 19.2768 3.00005C21.3505 5.12665 21.4142 8.55385 19.4211 10.76L13.6947 17.0982C12.1734 18.782 9.57654 18.782 8.05526 17.0982L2.32893 10.76C0.335783 8.55388 0.3995 5.12667 2.4732 3.00007C4.60412 0.814774 8.05904 0.814776 10.19 3.00007L10.875 3.70259Z" 
                stroke={isActive ? "none" : "currentColor"} 
                fill={isActive ? "currentColor" : "none"}
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
        </svg>
    )
}

const ProfileIcon = ({ isActive = false }: IconProps) => {
    if (isActive) {
        return (
            <svg width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Body outline - keep as stroke */}
                <path 
                    d="M17.9338 18.5488C16.9404 15.8918 14.3786 14 11.375 14C8.37138 14 5.8096 15.8918 4.81617 18.5488M17.9338 18.5488C20.0422 16.7154 21.375 14.0134 21.375 11C21.375 5.47715 16.8978 1 11.375 1C5.85215 1 1.375 5.47715 1.375 11C1.375 14.0134 2.70785 16.7154 4.81617 18.5488M17.9338 18.5488C16.1781 20.0756 13.8845 21 11.375 21C8.86552 21 6.57194 20.0756 4.81617 18.5488" 
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5" 
                    strokeLinejoin="round"
                />
                {/* Avatar circle - fill when active */}
                <circle 
                    cx="11.375" 
                    cy="8" 
                    r="3" 
                    fill="currentColor"
                />
            </svg>
        )
    }
    
    return (
        <svg width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
                d="M17.9338 18.5488C16.9404 15.8918 14.3786 14 11.375 14C8.37138 14 5.8096 15.8918 4.81617 18.5488M17.9338 18.5488C20.0422 16.7154 21.375 14.0134 21.375 11C21.375 5.47715 16.8978 1 11.375 1C5.85215 1 1.375 5.47715 1.375 11C1.375 14.0134 2.70785 16.7154 4.81617 18.5488M17.9338 18.5488C16.1781 20.0756 13.8845 21 11.375 21C8.86552 21 6.57194 20.0756 4.81617 18.5488M14.375 8C14.375 9.65685 13.0319 11 11.375 11C9.71815 11 8.375 9.65685 8.375 8C8.375 6.34315 9.71815 5 11.375 5C13.0319 5 14.375 6.34315 14.375 8Z" 
                stroke="currentColor" 
                fill="none"
                strokeWidth="1.5" 
                strokeLinejoin="round"
            />
        </svg>
    )
}

const CompletedIcon = () => {
    return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_369_2855" style={{maskType: "luminance"}} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
<path d="M11 21C12.3135 21.0016 13.6143 20.7437 14.8278 20.241C16.0412 19.7384 17.1434 19.0009 18.071 18.071C19.0009 17.1434 19.7384 16.0412 20.2411 14.8278C20.7437 13.6143 21.0016 12.3135 21 11C21.0016 9.68655 20.7437 8.38571 20.2411 7.17225C19.7384 5.95878 19.0009 4.85659 18.071 3.929C17.1434 2.99908 16.0412 2.26161 14.8278 1.75896C13.6143 1.25631 12.3135 0.99838 11 1C9.68655 0.99838 8.38572 1.25631 7.17225 1.75896C5.95878 2.26161 4.85659 2.99908 3.92901 3.929C2.99909 4.85659 2.26162 5.95878 1.75897 7.17225C1.25631 8.38571 0.998388 9.68655 1.00001 11C0.998388 12.3135 1.25631 13.6143 1.75897 14.8278C2.26162 16.0412 2.99909 17.1434 3.92901 18.071C4.85659 19.0009 5.95878 19.7384 7.17225 20.241C8.38572 20.7437 9.68655 21.0016 11 21Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
<path d="M7 11L10 14L16 8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</mask>
<g mask="url(#mask0_369_2855)">
<path d="M-1 -1H23V23H-1V-1Z" fill="#FF5757"/>
</g>    
</svg>

    )
}


const ActiveIcon = () => {
    return (
<svg width="17" height="20" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.70508 0.557617C9.81498 0.488379 9.95144 0.4746 10.0908 0.555664C12.8132 2.13825 16.5 5.52977 16.5 10.5576C16.5 13.336 15.5398 15.221 14.2393 16.4902C13.572 17.1413 12.8058 17.6378 12.0176 18.0088C12.318 17.4431 12.5 16.7436 12.5 15.8906C12.5 14.353 11.5239 13.4145 10.792 12.9863L10.791 12.9854L10.6836 12.9316C10.1475 12.7095 9.63857 13.1446 9.59961 13.6338V13.6357C9.58224 13.8606 9.46324 14.0386 9.3623 14.1084C9.3361 14.1265 9.31915 14.1321 9.31152 14.1338C9.30401 14.13 9.28712 14.1192 9.2627 14.0908C8.94345 13.7198 8.79395 13.1402 8.79395 12.7803V12.1904C8.79392 11.5091 8.0678 10.9441 7.37793 11.3496L7.37598 11.3506C6.18096 12.0607 4.5 13.5781 4.5 15.8906C4.50003 16.9886 4.83635 17.8263 5.3457 18.4453C4.65157 18.1831 3.94172 17.8059 3.28906 17.2793C1.76217 16.0472 0.500044 13.9717 0.5 10.5566C0.5 8.13479 1.68834 6.45802 2.91699 5.43555L3.16309 5.23926C3.38694 5.06835 3.61596 5.07213 3.80957 5.17773C4.0164 5.29062 4.19843 5.53302 4.23242 5.86328L4.31836 6.70117C4.38317 7.33678 4.70448 7.93208 5.17773 8.29004C5.67212 8.66381 6.34963 8.77932 6.98242 8.36816V8.36719C7.95044 7.7377 8.57414 6.6941 8.95508 5.66797C9.33807 4.63626 9.5 3.5587 9.5 2.7793V0.951172C9.5001 0.768225 9.59039 0.630035 9.70508 0.557617Z" fill="#FF5757" stroke="black"/>
</svg>
    )
}

const StepIcon = () => {
return (
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.27333 16.9345C3.21349 16.9345 2.35146 16.5516 1.70505 15.7913C1.05865 15.0309 0.634427 13.9027 0.387396 12.2611C0.0236461 9.84188 0.384584 7.80282 1.40365 6.51985C2.00365 5.76423 2.79115 5.32735 3.68083 5.25704C4.44255 5.1961 5.58115 5.50501 6.68083 7.31954C7.36943 8.45579 7.89302 9.96516 8.11755 11.4605C8.38896 13.2656 8.18693 14.5945 7.49974 15.5222C6.95412 16.2591 6.11505 16.7156 5.00552 16.8816C4.76309 16.9172 4.51837 16.9349 4.27333 16.9345ZM6.10943 23.25C5.49021 23.25 4.86255 23.0517 4.29724 22.6706C3.48152 22.1178 2.91689 21.2655 2.72599 20.2988C2.5924 19.6116 2.67255 19.0655 2.97068 18.6281C3.4549 17.918 4.32396 17.7581 5.24365 17.5884C5.34068 17.5706 5.43912 17.5528 5.53896 17.5336C5.75083 17.4933 5.9674 17.4399 6.1774 17.3878C6.96396 17.1938 7.77771 16.9927 8.44943 17.4699C8.89896 17.7886 9.15255 18.3305 9.22849 19.1255C9.31474 20.0428 9.11787 20.9583 8.67396 21.7036C8.1963 22.5056 7.48005 23.0358 6.65833 23.197C6.4775 23.2323 6.29368 23.2501 6.10943 23.25ZM15.7268 12.4345C15.482 12.4337 15.2376 12.4149 14.9955 12.3783C13.8865 12.2142 13.0474 11.7572 12.5018 11.0189C11.8146 10.0913 11.6111 8.76282 11.884 6.95719C12.1085 5.46048 12.6307 3.95251 13.316 2.82048C14.4101 1.01251 15.5501 0.698913 16.316 0.754225C17.2029 0.818913 17.989 1.24969 18.5899 2.0011C19.616 3.28407 19.9797 5.32923 19.6146 7.75923C19.3676 9.39985 18.949 10.5225 18.2969 11.2894C17.6449 12.0563 16.7866 12.4345 15.7268 12.4345ZM13.8907 18.75C13.7069 18.75 13.5236 18.7322 13.3432 18.697C12.5201 18.5358 11.8038 18.0056 11.3276 17.2036C10.8836 16.4583 10.6868 15.5428 10.773 14.6255C10.848 13.8286 11.1011 13.2886 11.5521 12.9694C12.2238 12.4927 13.0376 12.6933 13.8241 12.8878C14.0341 12.9394 14.2507 12.9928 14.4626 13.0336L14.7574 13.0884C15.6776 13.2577 16.5466 13.4166 17.0308 14.1277C17.329 14.565 17.4091 15.112 17.2755 15.7983C17.0848 16.7652 16.5202 17.6178 15.7043 18.1706C15.1357 18.5522 14.508 18.75 13.8907 18.75Z" fill="#FF5757"/>
</svg>

)
}

const HeartIcon = () => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.979 3.07401C7.86407 2.92321 8.77169 2.97296 9.63497 3.21958C10.4982 3.46621 11.2952 3.90343 11.967 4.49901L12.004 4.53201L12.038 4.50201C12.6792 3.93931 13.433 3.51981 14.2492 3.27149C15.0653 3.02318 15.9251 2.95177 16.771 3.06201L17.017 3.09801C18.0833 3.28212 19.08 3.75117 19.9015 4.45548C20.723 5.1598 21.3387 6.07316 21.6835 7.09885C22.0282 8.12454 22.0892 9.22437 21.8599 10.2819C21.6306 11.3394 21.1196 12.3152 20.381 13.106L20.201 13.291L20.153 13.332L12.703 20.711C12.5311 20.8812 12.3033 20.9832 12.0619 20.9983C11.8205 21.0134 11.5818 20.9405 11.39 20.793L11.296 20.711L3.803 13.289C3.00922 12.5167 2.4447 11.5397 2.17196 10.4663C1.89922 9.39287 1.92891 8.26491 2.25772 7.20733C2.58654 6.14974 3.20166 5.20381 4.03497 4.47428C4.86827 3.74476 5.88723 3.26011 6.979 3.07401Z" fill="#FF5757"/>
</svg>

    )
}

const CodeIcon = () => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 6.5L2 12.716L8 18.5M16 6.5L22 12.716L16 18.5" stroke="#FF5757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M14 2L10.5 22" stroke="#FF5757" strokeWidth="2" strokeLinecap="round"/>
</svg>

    )
}

const TransactionWithdrawIcon = () => {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.0834 18.3333H2.91671" stroke="#37B700" strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15.8334 2.91666L4.16671 14.5833" stroke="#37B700" strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15.8334 11.475V2.91666H7.27504" stroke="#37B700" strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>        

    )
}

const TransactionDepositIcon = () => {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.16663 14.5833L15.8333 2.91666" stroke="#B73100" strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M4.16663 6.02499V14.5833H12.725" stroke="#B73100" strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M2.91663 18.3333H17.0833" stroke="#B73100" strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
</svg>

    )
}

const WalletIcon = () => {
    return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clipPath="url(#clip0_369_3082)">
<path opacity="0.4" d="M36.08 27.1C35.24 27.92 34.76 29.1 34.88 30.36C35.06 32.52 37.04 34.1 39.2 34.1H43V36.48C43 40.62 39.62 44 35.48 44H12.52C8.38 44 5 40.62 5 36.48V23.02C5 18.88 8.38 15.5 12.52 15.5H35.48C39.62 15.5 43 18.88 43 23.02V25.9H38.96C37.84 25.9 36.82 26.34 36.08 27.1Z" fill="#FF5757"/>
<path d="M29.7 7.9V15.5H12.52C8.38 15.5 5 18.88 5 23.02V15.68C5 13.3 6.46 11.1799 8.68 10.3399L24.56 4.33994C27.04 3.41994 29.7 5.24 29.7 7.9Z" fill="#FF5757"/>
<path d="M45.1201 27.9399V32.0601C45.1201 33.1601 44.2401 34.06 43.1201 34.1H39.2001C37.0401 34.1 35.0601 32.52 34.8801 30.36C34.7601 29.1 35.2401 27.92 36.0801 27.1C36.8201 26.34 37.8401 25.9 38.9601 25.9H43.1201C44.2401 25.94 45.1201 26.8399 45.1201 27.9399Z" fill="#FF5757"/>
<path d="M28 25.5H14C13.18 25.5 12.5 24.82 12.5 24C12.5 23.18 13.18 22.5 14 22.5H28C28.82 22.5 29.5 23.18 29.5 24C29.5 24.82 28.82 25.5 28 25.5Z" fill="#FF5757"/>
</g>
<defs>
<clipPath id="clip0_369_3082">
<rect width="48" height="48" fill="white"/>
</clipPath>
</defs>
</svg>

    )
}
export { SearchIcon, CalendarIcon, StepsIcon, HomeIcon, ChallengesIcon, ProfileIcon, ActiveIcon, CompletedIcon, StepIcon, HeartIcon, CodeIcon, TransactionDepositIcon, TransactionWithdrawIcon, WalletIcon };