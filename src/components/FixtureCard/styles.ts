import styled from 'styled-components';

export const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

export const Date = styled.div`
  color: ${(props) => props.theme.colors.textLight};
  font-size: 14px;
  margin-bottom: 12px;
`;

export const Teams = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
`;

export const HomeTeam = styled.div<{ $isWinner?: boolean }>`
  font-weight: ${(props) => (props.$isWinner ? '700' : '500')};
  color: ${(props) => (props.$isWinner ? props.theme.colors.primary : props.theme.colors.text)};
  flex: 1;
  text-align: right;
`;

export const AwayTeam = styled.div<{ $isWinner?: boolean }>`
  font-weight: ${(props) => (props.$isWinner ? '700' : '500')};
  color: ${(props) => (props.$isWinner ? props.theme.colors.primary : props.theme.colors.text)};
  flex: 1;
  text-align: left;
`;

export const Score = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${(props) => props.theme.colors.text};
  white-space: nowrap;

  span {
    font-size: 14px;
    color: ${(props) => props.theme.colors.textLight};
    margin-left: 4px;
  }
`;

export const Venue = styled.div`
  color: ${(props) => props.theme.colors.textLight};
  font-size: 14px;
`;
