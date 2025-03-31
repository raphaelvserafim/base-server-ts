import { DataTypes, Model, Sequelize } from 'sequelize';
import { DB, Users } from '@app/database';

interface NewPasswordsAttributes {
  id?: number;
  userId: number;
  token: string;
  status: number;
  expire: Date;
}

class NewPasswords extends Model<NewPasswordsAttributes> {

  public static initialize(sequelize: Sequelize) {
    NewPasswords.init(
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true
        },
        userId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: Users,
            key: 'id'
          }
        },
        token: {
          type: DataTypes.STRING,
          allowNull: false
        },
        expire: {
          type: DataTypes.DATE,
          allowNull: true
        },
        status: {
          type: DataTypes.BIGINT,
          allowNull: false,
          defaultValue: true
        }
      },
      {
        sequelize,
        tableName: 'new_passwords',
        timestamps: true,
      }
    );

    NewPasswords.belongsTo(Users, { foreignKey: 'userId' });
  }
}

NewPasswords.initialize(DB.getInstance());

export { NewPasswords };
